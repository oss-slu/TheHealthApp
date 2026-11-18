# -------------------------------
#  Stage 1: Build the frontend
# -------------------------------
FROM node:22-alpine AS builder
WORKDIR /app/frontend

# Copy package files first (better caching)
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy shared contract and frontend source
COPY shared /app/shared
COPY frontend /app/frontend

# Vite inlines env at build time — production images must set VITE_DEMO_MODE=0 (default below).
ARG VITE_API_BASE_URL=
ARG VITE_ML_API_URL=
ARG VITE_DEMO_MODE=0
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_ML_API_URL=$VITE_ML_API_URL \
    VITE_DEMO_MODE=$VITE_DEMO_MODE

# Build Vite project
RUN npm run build

# -------------------------------
#  Stage 2: Serve using Nginx
# -------------------------------
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy the build output from stage 1
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
