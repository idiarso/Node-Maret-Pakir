#!/bin/bash

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    npm install -g pm2
fi

# Install dependencies for backend
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install dependencies for frontend
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Start the applications using PM2
echo "Starting applications with PM2..."
pm2 start ecosystem.config.js

# Save PM2 process list and set to start on system boot
echo "Setting up PM2 startup..."
pm2 save
pm2 startup

echo "Setup complete! Applications are running."
echo "Backend running on: http://localhost:3000"
echo "Frontend running on: http://localhost:3001"
echo ""
echo "To monitor applications, use: pm2 monit"
echo "To view logs, use: pm2 logs"
echo "To stop applications, use: pm2 stop all" 