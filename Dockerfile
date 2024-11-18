# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Add necessary packages
RUN apk add --no-cache python3 make g++ git

# Install PM2 globally
RUN npm install pm2 -g

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build client
WORKDIR /app/client
RUN npm ci --only=production
RUN npm run build

# Return to app root
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application with PM2
CMD ["pm2-runtime", "start", "src/server.js", "--name", "pension-system"]
