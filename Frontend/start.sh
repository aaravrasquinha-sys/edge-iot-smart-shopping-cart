#!/bin/bash

echo "Starting GrabCart Application..."

# Start Flask backend in background
echo "Starting Flask backend..."
cd "$(dirname "$0")"
python appfinal.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start React frontend
echo "Starting React frontend..."
npm run dev &
FRONTEND_PID=$!

echo "=========================================="
echo "GrabCart is starting up..."
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:8080"
echo "=========================================="

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
