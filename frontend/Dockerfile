# Frontend Dockerfile - Multi-stage build for React Application

# Stage 1: Build the React application
FROM node:18-alpine as build

WORKDIR /app

# Build arguments for environment variables
ARG REACT_APP_API_URL=https://constructefy.ai/api
ARG REACT_APP_GOOGLE_CLIENT_ID=641924991963-vbpberb599gec6d2kuath2m3hmdr1792.apps.googleusercontent.com
ARG REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyBT_YvAqHvUwSdXnLWLsAMELSxjBvPOdXk

# Set environment variables for build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID
ENV REACT_APP_GOOGLE_MAPS_API_KEY=$REACT_APP_GOOGLE_MAPS_API_KEY

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . ./

# Build the application
RUN npm run build

# Stage 2: Serve the built application with Nginx
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

