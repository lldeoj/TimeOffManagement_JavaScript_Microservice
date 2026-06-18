FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application files
COPY src ./src
COPY entrypoint.js ./

# Start consumer service
CMD ["sh", "-c", "node entrypoint.js && npm start"]
