# File Path: /home/ubuntu/rag-app-analysis/rag-app/frontend/Dockerfile
# Description: Dockerfile for the RAG application frontend service (Vite + React).

# === Build Stage ===
# Use Node.js 20 as the build environment.
FROM node:20 AS build

# Set the working directory inside the container.
WORKDIR /app

# Copy only package.json for clean dependency resolution
COPY rag-ui-new/package.json ./

# Install project dependencies with clean resolution and fix vulnerabilities
RUN rm -f package-lock.json && \
    npm install && \
    npm install reactflow && \
    npm audit fix --force

# Copy the rest of the frontend application code.
COPY rag-ui-new/ .

# Build the Vite application for production.
# This will generate static files in the /app/dist directory.
RUN echo "Starting frontend build..." && \
    npm run build && \
    echo "Frontend build completed successfully"

# === Production Stage ===
# Use a lightweight Nginx image to serve the static files.
# Copy the custom Nginx configuration file.
# This file should be located in the same directory as this Dockerfile (frontend/).

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Expose the port Nginx will listen on.
EXPOSE 3000

# Command to start Nginx in the foreground.
CMD ["nginx", "-g", "daemon off;"]