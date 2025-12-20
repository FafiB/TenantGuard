FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create storage directory
RUN mkdir -p storage

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S tenant-shield -u 1001

# Change ownership
RUN chown -R tenant-shield:nodejs /app

USER tenant-shield

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]