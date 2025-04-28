#!/bin/bash

# Start PostgreSQL
echo "Starting PostgreSQL..."
pg_ctl -D /var/lib/postgresql/data -l /var/lib/postgresql/data/logfile start

# Set environment variables
export PORT=12000
export REACT_APP_API_URL=http://localhost:12000/api
export CONVERT_API_SECRET=secret_KpZ4EmWSJCFOLYyX
export JWT_SECRET=your_jwt_secret_key_here
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/ppt_template_manager

# Create database if it doesn't exist
echo "Creating database if it doesn't exist..."
psql -U postgres -c "CREATE DATABASE ppt_template_manager;" || true

# Start backend in background
echo "Starting backend server..."
cd /workspace/ppt-template-manager/backend
npm install
node server.js &
BACKEND_PID=$!

# Start frontend in background
echo "Starting frontend server..."
cd /workspace/ppt-template-manager/frontend
npm install
npm start &
FRONTEND_PID=$!

# Function to handle script termination
cleanup() {
  echo "Stopping servers..."
  kill $BACKEND_PID
  kill $FRONTEND_PID
  exit
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

# Keep the script running
wait