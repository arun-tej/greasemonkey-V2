"""
Comprehensive error handling and logging middleware for GreaseMonkey API
"""

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import traceback
import time
from typing import Optional
import os
from datetime import datetime
from pathlib import Path

# Create logs directory
logs_dir = Path("./logs")
logs_dir.mkdir(exist_ok=True)

# Configure logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_FILE = os.getenv("LOG_FILE", "./logs/greasemonkey.log")

# Create formatters
detailed_formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(funcName)s() - %(message)s'
)

simple_formatter = logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s'
)

# Configure root logger
logging.basicConfig(level=getattr(logging, LOG_LEVEL))

# Create file handler
file_handler = logging.FileHandler(LOG_FILE)
file_handler.setFormatter(detailed_formatter)
file_handler.setLevel(logging.INFO)

# Create console handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(simple_formatter)
console_handler.setLevel(getattr(logging, LOG_LEVEL))

# Get logger for this module
logger = logging.getLogger("greasemonkey.error_handler")
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# Access logger for request/response logging
access_logger = logging.getLogger("greasemonkey.access")
access_handler = logging.FileHandler("./logs/access.log")
access_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(message)s'
))
access_logger.addHandler(access_handler)
access_logger.setLevel(logging.INFO)

class ErrorHandler:
    """Centralized error handling for the application"""
    
    @staticmethod
    def log_error(error: Exception, request: Request, user_id: Optional[str] = None):
        """Log error with context information"""
        error_details = {
            "error_type": type(error).__name__,
            "error_message": str(error),
            "url": str(request.url),
            "method": request.method,
            "user_id": user_id,
            "user_agent": request.headers.get("user-agent"),
            "ip_address": request.client.host if request.client else "unknown",
            "timestamp": datetime.utcnow().isoformat(),
            "traceback": traceback.format_exc()
        }
        
        logger.error(f"API Error: {error_details}")
    
    @staticmethod
    def create_error_response(
        status_code: int,
        message: str,
        details: Optional[dict] = None,
        error_code: Optional[str] = None
    ) -> JSONResponse:
        """Create standardized error response"""
        error_response = {
            "error": True,
            "status_code": status_code,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if error_code:
            error_response["error_code"] = error_code
        
        if details:
            error_response["details"] = details
        
        return JSONResponse(
            status_code=status_code,
            content=error_response
        )

# Custom exception classes
class GreaseMonkeyException(Exception):
    """Base exception for GreaseMonkey application"""
    def __init__(self, message: str, status_code: int = 500, error_code: Optional[str] = None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(self.message)

class ValidationError(GreaseMonkeyException):
    """Raised when data validation fails"""
    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY, "VALIDATION_ERROR")
        self.details = details

class AuthenticationError(GreaseMonkeyException):
    """Raised when authentication fails"""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, "AUTHENTICATION_ERROR")

class AuthorizationError(GreaseMonkeyException):
    """Raised when authorization fails"""
    def __init__(self, message: str = "Access denied"):
        super().__init__(message, status.HTTP_403_FORBIDDEN, "AUTHORIZATION_ERROR")

class NotFoundError(GreaseMonkeyException):
    """Raised when resource is not found"""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status.HTTP_404_NOT_FOUND, "NOT_FOUND_ERROR")

class ConflictError(GreaseMonkeyException):
    """Raised when there's a conflict with current state"""
    def __init__(self, message: str = "Conflict with current state"):
        super().__init__(message, status.HTTP_409_CONFLICT, "CONFLICT_ERROR")

class RateLimitError(GreaseMonkeyException):
    """Raised when rate limit is exceeded"""
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, status.HTTP_429_TOO_MANY_REQUESTS, "RATE_LIMIT_ERROR")

def setup_error_handlers(app: FastAPI):
    """Setup all error handlers for the FastAPI application"""
    
    @app.middleware("http")
    async def logging_middleware(request: Request, call_next):
        """Log all requests and responses"""
        start_time = time.time()
        
        # Log request
        access_logger.info(
            f"{request.method} {request.url} - "
            f"User-Agent: {request.headers.get('user-agent', 'unknown')} - "
            f"IP: {request.client.host if request.client else 'unknown'}"
        )
        
        response = await call_next(request)
        
        # Log response
        process_time = time.time() - start_time
        access_logger.info(
            f"{request.method} {request.url} - "
            f"Status: {response.status_code} - "
            f"Time: {process_time:.3f}s"
        )
        
        return response
    
    @app.exception_handler(GreaseMonkeyException)
    async def greasemonkey_exception_handler(request: Request, exc: GreaseMonkeyException):
        """Handle custom GreaseMonkey exceptions"""
        ErrorHandler.log_error(exc, request)
        
        return ErrorHandler.create_error_response(
            status_code=exc.status_code,
            message=exc.message,
            error_code=exc.error_code,
            details=getattr(exc, 'details', None)
        )
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Handle FastAPI HTTP exceptions"""
        ErrorHandler.log_error(exc, request)
        
        return ErrorHandler.create_error_response(
            status_code=exc.status_code,
            message=exc.detail,
            error_code="HTTP_ERROR"
        )
    
    @app.exception_handler(StarletteHTTPException)
    async def starlette_exception_handler(request: Request, exc: StarletteHTTPException):
        """Handle Starlette HTTP exceptions"""
        ErrorHandler.log_error(exc, request)
        
        return ErrorHandler.create_error_response(
            status_code=exc.status_code,
            message=exc.detail,
            error_code="HTTP_ERROR"
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle request validation errors"""
        ErrorHandler.log_error(exc, request)
        
        # Format validation errors
        errors = []
        for error in exc.errors():
            errors.append({
                "field": ".".join(str(x) for x in error["loc"]),
                "message": error["msg"],
                "type": error["type"]
            })
        
        return ErrorHandler.create_error_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            message="Validation error",
            error_code="VALIDATION_ERROR",
            details={"validation_errors": errors}
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle all other exceptions"""
        ErrorHandler.log_error(exc, request)
        
        # Don't expose internal errors in production
        if os.getenv("ENVIRONMENT", "development") == "production":
            message = "Internal server error"
        else:
            message = f"Internal server error: {str(exc)}"
        
        return ErrorHandler.create_error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=message,
            error_code="INTERNAL_ERROR"
        )

# Health check exception
class HealthCheckError(GreaseMonkeyException):
    """Raised when health check fails"""
    def __init__(self, message: str = "Health check failed"):
        super().__init__(message, status.HTTP_503_SERVICE_UNAVAILABLE, "HEALTH_CHECK_ERROR")

# Database connection exception  
class DatabaseError(GreaseMonkeyException):
    """Raised when database operation fails"""
    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message, status.HTTP_503_SERVICE_UNAVAILABLE, "DATABASE_ERROR")

# External service exception
class ExternalServiceError(GreaseMonkeyException):
    """Raised when external service call fails"""
    def __init__(self, message: str = "External service error", service_name: str = "unknown"):
        super().__init__(message, status.HTTP_503_SERVICE_UNAVAILABLE, "EXTERNAL_SERVICE_ERROR")
        self.service_name = service_name

# File operation exception
class FileOperationError(GreaseMonkeyException):
    """Raised when file operation fails"""
    def __init__(self, message: str = "File operation failed"):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR, "FILE_OPERATION_ERROR")

# Add request ID middleware for tracing
@staticmethod
async def add_request_id_middleware(request: Request, call_next):
    """Add unique request ID for tracing"""
    import uuid
    request_id = str(uuid.uuid4())
    
    # Add request ID to request state
    request.state.request_id = request_id
    
    # Call the next middleware/endpoint
    response = await call_next(request)
    
    # Add request ID to response headers
    response.headers["X-Request-ID"] = request_id
    
    return response

# Performance monitoring
class PerformanceMonitor:
    """Monitor API performance and log slow requests"""
    
    def __init__(self, slow_request_threshold: float = 5.0):
        self.slow_request_threshold = slow_request_threshold
        self.performance_logger = logging.getLogger("greasemonkey.performance")
        
        # Create performance log file
        perf_handler = logging.FileHandler("./logs/performance.log")
        perf_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(message)s'
        ))
        self.performance_logger.addHandler(perf_handler)
        self.performance_logger.setLevel(logging.INFO)
    
    async def monitor_request(self, request: Request, call_next):
        """Monitor request performance"""
        start_time = time.time()
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        
        # Log slow requests
        if process_time > self.slow_request_threshold:
            self.performance_logger.warning(
                f"SLOW REQUEST: {request.method} {request.url} - "
                f"Time: {process_time:.3f}s - "
                f"Status: {response.status_code}"
            )
        
        # Add performance header
        response.headers["X-Process-Time"] = str(process_time)
        
        return response

# Initialize performance monitor
performance_monitor = PerformanceMonitor()

def setup_middleware(app: FastAPI):
    """Setup all middleware for the application"""
    
    # Add request ID middleware
    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        return await add_request_id_middleware(request, call_next)
    
    # Add performance monitoring
    @app.middleware("http") 
    async def performance_middleware(request: Request, call_next):
        return await performance_monitor.monitor_request(request, call_next)