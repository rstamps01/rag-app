# File Path: /home/vastdata/rag-app/frontend/Dockerfile
# Description: Dockerfile for the RAG application frontend service (Vite + React).

# === Build Stage ===
# Use Node.js 20 as the build environment.
FROM node:20 AS build

# Set the working directory inside the container.
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) for the Vite project.
# Assumes these files are inside the rag-ui-new directory.
COPY rag-ui-new/package*.json ./

# Install project dependencies.
RUN npm install

# Copy the rest of the frontend application code.
COPY rag-ui-new/ .

# Build the Vite application for production.
# This will generate static files in the /app/dist directory.
RUN npm run build

# === Production Stage ===
# Use a lightweight Nginx image to serve the static files.
FROM nginx:stable-alpine

# Copy the Vite build output from the build stage to the Nginx web root.
# Vite outputs to the 'dist' directory by default.
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration file.
# This file should be located in the same directory as this Dockerfile (frontend/).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port Nginx will listen on.
EXPOSE 3000

# Command to start Nginx in the foreground.
CMD ["nginx", "-g", "daemon off;"]

