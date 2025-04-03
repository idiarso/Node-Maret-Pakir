#!/bin/bash

# Build frontend
echo "Building frontend..."
cd frontend
npm run build
cd ..

# Start applications in production mode
echo "Starting applications in production mode..."
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

echo "Applications are running in production mode!"
echo "To monitor: pm2 monit"
echo "To view logs: pm2 logs" 