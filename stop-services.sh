#!/bin/bash

echo "Stopping NodeTSpark services..."

# Stop all processes
pm2 stop nodetsspark-backend nodetsspark-frontend

# Delete processes from PM2
pm2 delete nodetsspark-backend nodetsspark-frontend

echo "All services stopped successfully!" 