#!/usr/bin/env python3
"""
IDE Setup Script for GreaseMonkey V2 Backend
This script helps configure your IDE to properly recognize the Python environment
"""

import os
import sys
import json
from pathlib import Path

def setup_ide_configuration():
    """Create IDE configuration files"""
    backend_dir = Path(__file__).parent
    venv_python = backend_dir / "venv" / "bin" / "python"
    site_packages = backend_dir / "venv" / "lib" / "python3.13" / "site-packages"
    
    print("🔧 Setting up IDE configuration for GreaseMonkey V2 Backend...")
    
    # Check if virtual environment exists
    if not venv_python.exists():
        print("❌ Virtual environment not found!")
        print("💡 Run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt")
        return False
    
    # Create .vscode directory if it doesn't exist
    vscode_dir = backend_dir / ".vscode"
    vscode_dir.mkdir(exist_ok=True)
    
    # Create VS Code settings
    vscode_settings = {
        "python.defaultInterpreterPath": str(venv_python),
        "python.analysis.extraPaths": [
            str(site_packages),
            str(backend_dir)
        ],
        "python.analysis.autoSearchPaths": True,
        "python.analysis.useLibraryCodeForTypes": True,
        "python.linting.enabled": True,
        "python.linting.pylintEnabled": False,
        "python.linting.flake8Enabled": True,
        "python.formatting.provider": "black",
        "python.analysis.typeCheckingMode": "basic",
        "python.terminal.activateEnvironment": True,
        "python.envFile": "${workspaceFolder}/.env"
    }
    
    settings_file = vscode_dir / "settings.json"
    with open(settings_file, 'w') as f:
        json.dump(vscode_settings, f, indent=2)
    print(f"✅ Created VS Code settings: {settings_file}")
    
    # Print instructions
    print("\n📋 IDE Setup Instructions:")
    print("1. Restart your IDE/Editor")
    print("2. Open the backend folder as your workspace")
    print(f"3. Select Python interpreter: {venv_python}")
    print("4. The import errors should resolve automatically")
    
    print("\n🔍 For VS Code users:")
    print("- Press Cmd+Shift+P (macOS) or Ctrl+Shift+P (Windows/Linux)")
    print("- Type 'Python: Select Interpreter'")
    print(f"- Choose: {venv_python}")
    
    print("\n🐍 Virtual Environment Details:")
    print(f"📍 Python executable: {venv_python}")
    print(f"📦 Site packages: {site_packages}")
    print(f"🔗 Current Python: {sys.executable}")
    
    return True

if __name__ == "__main__":
    success = setup_ide_configuration()
    sys.exit(0 if success else 1)