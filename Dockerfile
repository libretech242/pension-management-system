# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Add necessary packages and security updates
RUN apk update && \
    apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/cache/apk/*

# Install PM2 globally
RUN npm install pm2 -g

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start the application with PM2
CMD ["pm2-runtime", "start", "src/server.js", "--name", "pension-system"]
