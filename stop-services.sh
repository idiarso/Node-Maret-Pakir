#!/bin/bash

# Timestamp for logging
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Stopping services..."

# Change to the project directory
cd "$(dirname "$0")"

# Stop backend service
if [ -f backend.pid ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Stopping backend service..."
    kill $(cat backend.pid)
    rm backend.pid
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backend service stopped."
fi

# Stop frontend service
if [ -f frontend/frontend.pid ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Stopping frontend service..."
    kill $(cat frontend/frontend.pid)
    rm frontend/frontend.pid
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Frontend service stopped."
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] All services stopped successfully!" 