# backend/Dockerfile

# Use an official lightweight Python image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install essential system dependencies (Crucial for bcrypt, cryptography)
RUN apt-get update && \
    apt-get install -y build-essential libffi-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY requirements.txt .

# Install Python dependencies
# Note: Using build-essential requires the pip install step to happen AFTER build-essential is installed.
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src ./src
COPY .env .env

# Expose FastAPI port
EXPOSE 8000

# Default command
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]