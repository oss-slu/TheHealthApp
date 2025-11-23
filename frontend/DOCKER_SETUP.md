# Docker Setup Guide for Frontend

## Prerequisites

Before you begin, ensure you have the following installed:
- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
  - Download: https://www.docker.com/products/docker-desktop
- **Git** (for cloning the repository)
  - Download: https://git-scm.com/downloads

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/oss-slu/TheHealthApp.git
cd TheHealthApp/frontend
```

### 2. Build the Docker Image

```bash
docker build -t health-app-frontend .
```

This command:
- Builds the frontend application using Node.js
- Creates a production-ready build
- Packages it in an Nginx container
- Takes approximately 2-5 minutes on first build

### 3. Run the Container

```bash
docker run -d -p 8080:80 --name health-app-frontend health-app-frontend
```

**Parameters explained:**
- `-d`: Run in detached mode (background)
- `-p 8080:80`: Map port 8080 on your machine to port 80 in the container
- `--name health-app-frontend`: Give the container a friendly name
- `health-app-frontend`: The image name to run

### 4. Access the Application

Open your browser and navigate to:
- **Local**: http://localhost:8080
- **Network**: http://YOUR_IP_ADDRESS:8080

## Common Commands

### View Running Containers
```bash
docker ps
```

### View Container Logs
```bash
docker logs health-app-frontend
```

### View Last 50 Lines of Logs
```bash
docker logs --tail 50 health-app-frontend
```

### Follow Logs in Real-Time
```bash
docker logs -f health-app-frontend
```

### Stop the Container
```bash
docker stop health-app-frontend
```

### Start a Stopped Container
```bash
docker start health-app-frontend
```

### Restart the Container
```bash
docker restart health-app-frontend
```

### Remove the Container
```bash
docker rm health-app-frontend
```

### Remove Container and Image
```bash
docker rm -f health-app-frontend
docker rmi health-app-frontend
```

## Rebuild After Code Changes

When you make changes to the code, you need to rebuild:

```bash
# Stop and remove old container
docker stop health-app-frontend
docker rm health-app-frontend

# Rebuild the image
docker build -t health-app-frontend .

# Run new container
docker run -d -p 8080:80 --name health-app-frontend health-app-frontend
```

## Development Workflow

### Option 1: Development Mode (Recommended for Active Development)

For active development, use npm directly instead of Docker:

```bash
# Install dependencies (first time only)
npm install

# Run development server
npm run dev
```

This runs on `http://localhost:5173` with hot-reload enabled.

### Option 2: Docker for Testing Production Build

Use Docker when you want to test the production build:

```bash
# Build and run
docker build -t health-app-frontend .
docker run -d -p 8080:80 --name health-app-frontend health-app-frontend
```

## Troubleshooting

### Port Already in Use

If port 8080 is already in use, use a different port:

```bash
docker run -d -p 3000:80 --name health-app-frontend health-app-frontend
```

Then access at `http://localhost:3000`

### Container Won't Start

Check logs for errors:
```bash
docker logs health-app-frontend
```

### Container Name Already Exists

If you get an error about the container name existing:

```bash
# Remove the old container first
docker rm -f health-app-frontend

# Then run again
docker run -d -p 8080:80 --name health-app-frontend health-app-frontend
```

### Rebuild from Scratch

If you encounter issues, rebuild from scratch:

```bash
# Remove container and image
docker rm -f health-app-frontend
docker rmi health-app-frontend

# Rebuild
docker build -t health-app-frontend .
docker run -d -p 8080:80 --name health-app-frontend health-app-frontend
```

### Docker Not Running

Make sure Docker Desktop is running:
- **Windows/Mac**: Open Docker Desktop application
- **Linux**: `sudo systemctl start docker`

Check Docker status:
```bash
docker ps
```

### Build Fails

If the build fails:
1. Check you're in the correct directory (`frontend/`)
2. Ensure `package.json` exists
3. Check Docker has enough resources (Docker Desktop > Settings > Resources)
4. View build logs for specific errors

### Permission Denied (Linux)

If you get permission errors on Linux:
```bash
sudo usermod -aG docker $USER
# Log out and log back in
```

## File Structure

```
frontend/
├── Dockerfile          # Docker build instructions
├── .dockerignore       # Files to exclude from Docker build
├── package.json        # Node.js dependencies
├── src/                # Source code
└── dist/               # Build output (generated, not in git)
```

## Understanding the Dockerfile

The Dockerfile uses a **multi-stage build**:

1. **Stage 1 (builder)**: 
   - Uses Node.js to install dependencies and build the app
   - Creates optimized production build in `/app/dist`

2. **Stage 2 (nginx)**:
   - Uses lightweight Nginx Alpine image
   - Copies only the built files from stage 1
   - Serves the static files on port 80

This approach results in a smaller final image (~50MB vs ~500MB+).

## Environment Variables

Currently, the frontend uses default API endpoints. To customize:

1. Create a `.env` file in the frontend directory:
   ```
   VITE_API_BASE_URL=http://your-api-url
   ```

2. Rebuild the Docker image:
   ```bash
   docker build -t health-app-frontend .
   ```

## Sharing with Team

### For Local Network Access

1. Find your IP address:
   - **Windows**: `ipconfig` (look for IPv4 Address)
   - **Mac/Linux**: `ifconfig` or `ip addr`

2. Share the URL: `http://YOUR_IP:8080`

3. Ensure firewall allows port 8080:
   - **Windows**: Windows Defender Firewall settings
   - **Mac**: System Preferences > Security & Privacy > Firewall
   - **Linux**: `sudo ufw allow 8080`

### For Remote Access

**Option 1: ngrok (Temporary Tunnel)**
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 8080
# Share the ngrok URL with your team
```

**Option 2: Cloud Deployment**
- Deploy to AWS, Heroku, Vercel, or Netlify
- See deployment guides in repository

## Best Practices

1. **Always pull latest changes** before building:
   ```bash
   git pull origin feature/40-auth-flow-dashboard-redesign
   ```

2. **Use development mode** (`npm run dev`) for active coding
3. **Use Docker** for testing production builds
4. **Clean up unused images** periodically:
   ```bash
   docker system prune -a
   ```

5. **Tag your images** for version control:
   ```bash
   docker build -t health-app-frontend:v1.0 .
   ```

6. **Use docker-compose** for multi-container setups (if needed)

## Advanced Usage

### Run with Custom Port
```bash
docker run -d -p 3000:80 --name health-app-frontend health-app-frontend
```

### Run with Environment Variables
```bash
docker run -d -p 8080:80 \
  -e VITE_API_BASE_URL=http://api.example.com \
  --name health-app-frontend \
  health-app-frontend
```

### Execute Commands in Running Container
```bash
docker exec -it health-app-frontend sh
```

### Copy Files from Container
```bash
docker cp health-app-frontend:/usr/share/nginx/html ./backup
```

### View Container Resource Usage
```bash
docker stats health-app-frontend
```

## Support

If you encounter issues:
1. Check Docker logs: `docker logs health-app-frontend`
2. Verify Docker is running: `docker ps`
3. Check port availability: 
   - Windows: `netstat -an | findstr 8080`
   - Mac/Linux: `lsof -i :8080`
4. Contact the team lead or create an issue in GitHub

## Quick Reference Card

```bash
# Build
docker build -t health-app-frontend .

# Run
docker run -d -p 8080:80 --name health-app-frontend health-app-frontend

# Stop
docker stop health-app-frontend

# Start
docker start health-app-frontend

# Remove
docker rm -f health-app-frontend

# Logs
docker logs health-app-frontend

# Rebuild
docker stop health-app-frontend && docker rm health-app-frontend && docker build -t health-app-frontend . && docker run -d -p 8080:80 --name health-app-frontend health-app-frontend
```

