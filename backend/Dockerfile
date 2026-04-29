FROM node:18-bullseye-slim

# Install FFmpeg and Python3 (for yt-dlp)
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip python-is-python3 curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Make start script executable
COPY start.sh .
RUN chmod +x start.sh

# Expose port
EXPOSE 4000

# Default command
CMD ["./start.sh"]
