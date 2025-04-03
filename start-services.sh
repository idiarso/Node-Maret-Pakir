#!/bin/bash

echo "Starting NodeTSpark services..."

# Change to backend directory and start the server
cd backend
echo "Starting backend server on port 3000..."
pm2 start npm --name "nodetsspark-backend" -- run dev

# Change to frontend directory and start the server
cd ../frontend
echo "Starting frontend server on port 3001..."
pm2 start npm --name "nodetsspark-frontend" -- run dev

# Show running processes
echo "\nRunning services:"
pm2 list

echo "\nServices started successfully!"
echo "Backend running on http://localhost:3000"
echo "Frontend running on http://localhost:3001" 