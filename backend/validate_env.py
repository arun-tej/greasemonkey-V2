#!/usr/bin/env python3
"""
Environment validation script for GreaseMonkey V2 Backend
Run this to verify all dependencies are properly installed
"""

import sys
import os
from pathlib import Path

def validate_environment():
    """Validate the Python environment and required packages"""
    print("🔍 Validating GreaseMonkey V2 Backend Environment...")
    print(f"📍 Working directory: {os.getcwd()}")
    print(f"🐍 Python version: {sys.version}")
    print(f"📦 Python executable: {sys.executable}")
    
    # Check if we're in virtual environment
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("✅ Virtual environment detected")
    else:
        print("⚠️  Not running in virtual environment")
    
    print("\n📚 Checking required packages...")
    
    required_packages = [
        'fastapi',
        'uvicorn', 
        'pydantic',
        'starlette',
        'dotenv',
        'pymongo',
        'motor',
        'jose',
        'passlib',
        'bcrypt'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            if package == 'dotenv':
                from dotenv import load_dotenv
                import dotenv
                print(f"✅ {package} (python-dotenv): installed")
            elif package == 'jose':
                import jose
                print(f"✅ {package} (python-jose): {jose.__version__}")
            else:
                module = __import__(package)
                version = getattr(module, '__version__', 'unknown')
                print(f"✅ {package}: {version}")
        except ImportError:
            print(f"❌ {package}: NOT FOUND")
            missing_packages.append(package)
    
    print(f"\n📁 Current PYTHONPATH:")
    for path in sys.path:
        print(f"   {path}")
    
    if missing_packages:
        print(f"\n❌ Missing packages: {', '.join(missing_packages)}")
        print("💡 Run: pip install -r requirements.txt")
        return False
    else:
        print("\n🎉 All required packages are installed!")
        return True

if __name__ == "__main__":
    success = validate_environment()
    sys.exit(0 if success else 1)