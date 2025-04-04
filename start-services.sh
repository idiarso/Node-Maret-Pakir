#!/bin/bash

# Timestamp for logging
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting services..."

# Change to the project directory
cd "$(dirname "$0")"

# Start backend service
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backend service..."
cd /home/tekno/Desktop/NodeTSpark
npm run dev &
echo $! > backend.pid

# Wait a bit for backend to initialize
sleep 5

# Start frontend service
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting frontend service..."
cd /home/tekno/Desktop/NodeTSpark/frontend
npm run dev &
echo $! > frontend.pid

echo "[$(date '+%Y-%m-%d %H:%M:%S')] All services started successfully!"
echo "Backend running on http://localhost:3000"
echo "Frontend running on http://localhost:3001" 