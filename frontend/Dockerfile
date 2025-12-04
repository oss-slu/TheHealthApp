# -------------------------------
#  Stage 1: Build the frontend
# -------------------------------
FROM node:18-alpine AS builder
WORKDIR /app

# Accept build argument for ML API URL
ARG VITE_ML_API_URL=http://localhost:8001/predict
ENV VITE_ML_API_URL=$VITE_ML_API_URL

# Copy package.json first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all frontend files
COPY . .

# Build Vite project
RUN npm run build

# -------------------------------
#  Stage 2: Serve using Nginx
# -------------------------------
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy the build output from stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
