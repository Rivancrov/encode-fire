#!/bin/bash

echo "🔥 Starting Fire Detection & Prediction System Backend..."

# Navigate to backend directory
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Create database tables
echo "🗄️ Setting up database..."
python -c "from database import create_tables; create_tables(); print('Database tables created successfully!')"

# Start the FastAPI server using python -m
echo "🚀 Starting FastAPI server on http://localhost:8000..."
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload