#!/bin/bash
set -e

echo "Building backend Docker image..."
docker build -f backend/Dockerfile -t rag-app-07-backend-07:latest ./backend
echo "Backend build complete!"

if [ "$1" = "--clean" ]; then
    echo "Cleaning up intermediate images..."
    docker image prune -f
fi
