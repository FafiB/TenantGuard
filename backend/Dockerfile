FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN mkdir -p storage
RUN addgroup -g 1001 -S nodejs
RUN adduser -S tenant-shield -u 1001
RUN chown -R tenant-shield:nodejs /app
USER tenant-shield
EXPOSE 5000
CMD ["npm", "start"]