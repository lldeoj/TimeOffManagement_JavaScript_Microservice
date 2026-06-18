FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application files
COPY src ./src
COPY entrypoint.js ./

# Expose port
EXPOSE 3000

# Start application
CMD ["sh", "-c", "node entrypoint.js && npm start"]
