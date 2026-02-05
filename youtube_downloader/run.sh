#!/bin/bash
# Run both backend and frontend in development mode

# Start backend in background
echo "Starting backend on http://localhost:8000..."
cd "$(dirname "$0")"
uvicorn backend.main:app --reload --port 8000 &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend on http://localhost:5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!

# Handle Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Wait for both processes
wait
