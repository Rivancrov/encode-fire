#!/bin/bash

echo "🔥 Starting Fire Detection & Prediction System..."
echo ""

# Check if backend is running
if curl -s http://localhost:8000 > /dev/null; then
    echo "✅ Backend running on http://localhost:8000"
else
    echo "❌ Backend not running. Starting backend..."
    cd backend && source venv/bin/activate && python main.py &
    sleep 3
fi

# Start frontend on port 3002
echo "🚀 Starting frontend on http://localhost:3002..."
cd frontend && npm run dev -- --port 3002 --open

echo ""
echo "🌐 Open your browser to: http://localhost:3002"
echo "📊 Backend API available at: http://localhost:8000"
echo ""
echo "Features available:"
echo "  • Fire Detection Map with real NASA FIRMS data"
echo "  • AI Chatbot with tool calling capabilities" 
echo "  • Fire Prediction Maps"
echo "  • Educational Impact content"
echo ""
echo "Press Ctrl+C to stop the application"