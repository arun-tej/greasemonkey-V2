"""
Security and validation middleware for GreaseMonkey API
"""

from fastapi import FastAPI, Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.gzip import GZipMiddleware
import os
import time
import hashlib
import hmac
from typing import Dict, Set, Optional
import re
from datetime import datetime, timedelta
import logging

# Security configuration
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "3600"))  # 1 hour
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")

# Security headers
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'",
    "Referrer-Policy": "strict-origin-when-cross-origin"
}

logger = logging.getLogger("greasemonkey.security")

class RateLimiter:
    """Rate limiting implementation"""
    
    def __init__(self):
        # Store request counts: {ip_address: {timestamp: count}}
        self.request_counts: Dict[str, Dict[int, int]] = {}
        # Store blocked IPs: {ip_address: block_until_timestamp}
        self.blocked_ips: Dict[str, float] = {}
    
    def is_rate_limited(self, ip_address: str) -> bool:
        """Check if IP is rate limited"""
        current_time = time.time()
        window_start = int(current_time - RATE_LIMIT_WINDOW)
        
        # Check if IP is blocked
        if ip_address in self.blocked_ips:
            if current_time < self.blocked_ips[ip_address]:
                return True
            else:
                # Unblock IP
                del self.blocked_ips[ip_address]
        
        # Clean old entries
        if ip_address in self.request_counts:
            self.request_counts[ip_address] = {
                timestamp: count for timestamp, count in self.request_counts[ip_address].items()
                if timestamp > window_start
            }
        
        # Count requests in current window
        if ip_address not in self.request_counts:
            self.request_counts[ip_address] = {}
        
        current_window = int(current_time / 60)  # 1-minute windows
        total_requests = sum(self.request_counts[ip_address].values())
        
        if total_requests >= RATE_LIMIT_REQUESTS:
            # Block IP for 1 hour
            self.blocked_ips[ip_address] = current_time + 3600
            logger.warning(f"Rate limit exceeded for IP: {ip_address}")
            return True
        
        # Increment request count
        if current_window not in self.request_counts[ip_address]:
            self.request_counts[ip_address][current_window] = 0
        self.request_counts[ip_address][current_window] += 1
        
        return False

class InputValidator:
    """Input validation and sanitization"""
    
    # Patterns for validation
    PATTERNS = {
        "email": re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"),
        "username": re.compile(r"^[a-zA-Z0-9_]{3,20}$"),
        "password": re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"),
        "phone": re.compile(r"^\+?1?\d{9,15}$"),
        "url": re.compile(r"^https?://[^\s/$.?#].[^\s]*$")
    }
    
    # SQL injection patterns
    SQL_INJECTION_PATTERNS = [
        re.compile(pattern, re.IGNORECASE) for pattern in [
            r"(\bUNION\b.+\bSELECT\b)",
            r"(\bSELECT\b.+\bFROM\b)",
            r"(\bINSERT\b.+\bINTO\b)",
            r"(\bUPDATE\b.+\bSET\b)",
            r"(\bDELETE\b.+\bFROM\b)",
            r"(\bDROP\b.+\bTABLE\b)",
            r"(\bCREATE\b.+\bTABLE\b)",
            r"(\bALTER\b.+\bTABLE\b)",
            r"(\bEXEC\b|\bEXECUTE\b)",
            r"(--|\#|/\*|\*/)",
            r"(\bOR\b.+\b1=1\b)",
            r"(\bAND\b.+\b1=1\b)"
        ]
    ]
    
    # XSS patterns
    XSS_PATTERNS = [
        re.compile(pattern, re.IGNORECASE) for pattern in [
            r"<script[^>]*>.*?</script>",
            r"javascript:",
            r"vbscript:",
            r"on\w+\s*=",
            r"<iframe[^>]*>.*?</iframe>",
            r"<object[^>]*>.*?</object>",
            r"<embed[^>]*>.*?</embed>",
            r"<link[^>]*>",
            r"<meta[^>]*>"
        ]
    ]
    
    @classmethod
    def validate_email(cls, email: str) -> bool:
        """Validate email format"""
        return bool(cls.PATTERNS["email"].match(email))
    
    @classmethod
    def validate_username(cls, username: str) -> bool:
        """Validate username format"""
        return bool(cls.PATTERNS["username"].match(username))
    
    @classmethod
    def validate_password(cls, password: str) -> bool:
        """Validate password strength"""
        return bool(cls.PATTERNS["password"].match(password))
    
    @classmethod
    def sanitize_input(cls, input_string: str) -> str:
        """Sanitize input string"""
        if not isinstance(input_string, str):
            return str(input_string)
        
        # Remove potential XSS
        for pattern in cls.XSS_PATTERNS:
            input_string = pattern.sub("", input_string)
        
        # Remove potential SQL injection
        for pattern in cls.SQL_INJECTION_PATTERNS:
            input_string = pattern.sub("", input_string)
        
        # Basic HTML entity encoding
        input_string = input_string.replace("&", "&amp;")
        input_string = input_string.replace("<", "&lt;")
        input_string = input_string.replace(">", "&gt;")
        input_string = input_string.replace('"', "&quot;")
        input_string = input_string.replace("'", "&#x27;")
        
        return input_string.strip()
    
    @classmethod
    def detect_malicious_content(cls, content: str) -> bool:
        """Detect potentially malicious content"""
        # Check for SQL injection patterns
        for pattern in cls.SQL_INJECTION_PATTERNS:
            if pattern.search(content):
                return True
        
        # Check for XSS patterns
        for pattern in cls.XSS_PATTERNS:
            if pattern.search(content):
                return True
        
        return False

class CSRFProtection:
    """CSRF protection implementation"""
    
    def __init__(self):
        self.csrf_tokens: Dict[str, float] = {}  # {token: timestamp}
        self.token_lifetime = 3600  # 1 hour
    
    def generate_csrf_token(self, user_id: str) -> str:
        """Generate CSRF token for user"""
        timestamp = str(int(time.time()))
        data = f"{user_id}:{timestamp}"
        token = hmac.new(
            SECRET_KEY.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
        
        csrf_token = f"{timestamp}:{token}"
        self.csrf_tokens[csrf_token] = time.time()
        return csrf_token
    
    def validate_csrf_token(self, token: str, user_id: str) -> bool:
        """Validate CSRF token"""
        if not token or token not in self.csrf_tokens:
            return False
        
        # Check if token expired
        if time.time() - self.csrf_tokens[token] > self.token_lifetime:
            del self.csrf_tokens[token]
            return False
        
        # Verify token
        try:
            timestamp, token_hash = token.split(":", 1)
            data = f"{user_id}:{timestamp}"
            expected_token = hmac.new(
                SECRET_KEY.encode(),
                data.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(token_hash, expected_token)
        except ValueError:
            return False
    
    def cleanup_expired_tokens(self):
        """Remove expired CSRF tokens"""
        current_time = time.time()
        expired_tokens = [
            token for token, timestamp in self.csrf_tokens.items()
            if current_time - timestamp > self.token_lifetime
        ]
        for token in expired_tokens:
            del self.csrf_tokens[token]

# Global instances
rate_limiter = RateLimiter()
csrf_protection = CSRFProtection()

def setup_security_middleware(app: FastAPI):
    """Setup security middleware"""
    
    # Add trusted host middleware
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=ALLOWED_HOSTS
    )
    
    # Add gzip compression
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    
    @app.middleware("http")
    async def security_headers_middleware(request: Request, call_next):
        """Add security headers to all responses"""
        response = await call_next(request)
        
        # Add security headers
        for header, value in SECURITY_HEADERS.items():
            response.headers[header] = value
        
        return response
    
    @app.middleware("http")
    async def rate_limit_middleware(request: Request, call_next):
        """Rate limiting middleware"""
        ip_address = request.client.host if request.client else "unknown"
        
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/api/", "/docs", "/redoc"]:
            return await call_next(request)
        
        if rate_limiter.is_rate_limited(ip_address):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later."
            )
        
        return await call_next(request)
    
    @app.middleware("http")
    async def input_validation_middleware(request: Request, call_next):
        """Input validation middleware"""
        # Skip validation for certain paths
        skip_paths = ["/docs", "/redoc", "/openapi.json", "/health"]
        if any(request.url.path.startswith(path) for path in skip_paths):
            return await call_next(request)
        
        # Check for malicious content in URL
        if InputValidator.detect_malicious_content(str(request.url)):
            logger.warning(f"Malicious URL detected: {request.url}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Malicious content detected in request"
            )
        
        # For POST/PUT/PATCH requests, validate body content
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                if body:
                    body_str = body.decode("utf-8")
                    if InputValidator.detect_malicious_content(body_str):
                        logger.warning(f"Malicious content in request body from {request.client.host}")
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Malicious content detected in request body"
                        )
            except Exception:
                pass  # Continue if body can't be decoded
        
        return await call_next(request)

# Content validation functions
def validate_post_content(content: str) -> str:
    """Validate and sanitize post content"""
    if not content or len(content.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post content cannot be empty"
        )
    
    if len(content) > 2000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post content too long (max 2000 characters)"
        )
    
    if InputValidator.detect_malicious_content(content):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malicious content detected"
        )
    
    return InputValidator.sanitize_input(content)

def validate_user_input(data: dict) -> dict:
    """Validate and sanitize user input data"""
    sanitized_data = {}
    
    for key, value in data.items():
        if isinstance(value, str):
            if InputValidator.detect_malicious_content(value):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Malicious content detected in field: {key}"
                )
            sanitized_data[key] = InputValidator.sanitize_input(value)
        else:
            sanitized_data[key] = value
    
    return sanitized_data

# Password strength validator
def validate_password_strength(password: str) -> bool:
    """Validate password meets security requirements"""
    if not InputValidator.validate_password(password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character"
        )
    return True

# File upload security
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_IMAGE_MIMETYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def validate_uploaded_file(file_content: bytes, filename: str, content_type: str):
    """Validate uploaded file for security"""
    # Check file size
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large"
        )
    
    # Check file extension
    if filename:
        file_ext = os.path.splitext(filename.lower())[1]
        if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File type not allowed"
            )
    
    # Check content type
    if content_type not in ALLOWED_IMAGE_MIMETYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content type"
        )
    
    # Check for malicious content in filename
    if filename and InputValidator.detect_malicious_content(filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malicious filename detected"
        )

# API key validation
def validate_api_key(api_key: str) -> bool:
    """Validate API key format"""
    if not api_key or len(api_key) < 32:
        return False
    
    # Check for valid characters only
    if not re.match(r"^[a-zA-Z0-9_-]+$", api_key):
        return False
    
    return True