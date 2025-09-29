#!/bin/bash

# GreaseMonkey V2 Development Startup Script

echo "🏍️  Starting GreaseMonkey V2 Development Environment..."
echo "============================================"

# Check if we're in the right directory
if [ ! -f "greasemonkey-v2.code-workspace" ]; then
    echo "❌ Error: Please run this script from the greasemonkey-V2-1 directory"
    exit 1
fi

echo "📁 Project directory verified ✓"

# Backend Setup
echo ""
echo "🔧 Setting up backend..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Check if dependencies are installed
if [ ! -f "venv/bin/uvicorn" ]; then
    echo "Installing backend dependencies..."
    pip install -r requirements.txt
fi

echo "✅ Backend setup complete"

# Frontend Setup
echo ""
echo "🎨 Setting up frontend..."
cd ../frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install --legacy-peer-deps
fi

# Set port 3001 in .env
echo "PORT=3001" > .env

echo "✅ Frontend setup complete"

echo ""
echo "🚀 All systems ready!"
echo ""
echo "To start development servers:"
echo "  Backend:  cd backend && source venv/bin/activate && uvicorn server:app --reload --port 8000"
echo "  Frontend: cd frontend && npm start"
echo ""
echo "🌐 URLs:"
echo "  Frontend: http://localhost:3001"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "🏍️  Happy coding with GreaseMonkey V2!"