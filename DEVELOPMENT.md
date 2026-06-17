# Development Configuration Guide

## Local Development Setup

### Prerequisites
- Node.js 20+ ([Download](https://nodejs.org/))
- npm 9+
- RabbitMQ ([Docker](https://hub.docker.com/_/rabbitmq))
- MongoDB ([Docker](https://hub.docker.com/_/mongo))

### Quick Start (Using Docker)

```bash
# Navigate to project root
cd time-off-microservice

# Start all services
docker-compose up --build

# In another terminal, run tests
npm run test

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Local Development (Without Docker)

#### 1. Start RabbitMQ
```bash
# Using Docker (recommended)
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.13-management

# Access RabbitMQ UI
# http://localhost:15672 (guest:guest)
```

#### 2. Start MongoDB
```bash
# Using Docker (recommended)
docker run -d --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:7
```

#### 3. Setup Publisher API
```bash
cd publisher-api

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Server will be available at http://localhost:3000
```

#### 4. Setup Consumer Service (in another terminal)
```bash
cd consumer-service

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start service
npm run dev
```

### Development Workflow

#### Making Changes
1. **Edit files** - Changes are automatically picked up with nodemon
2. **Test endpoints** - Use provided EXAMPLES.md
3. **Check logs** - Monitor console output
4. **Restart if needed** - Server restarts automatically on file changes

#### Adding Dependencies
```bash
# Publisher API
cd publisher-api
npm install new-package-name

# Consumer Service
cd consumer-service
npm install new-package-name
```

#### Testing

##### Manual Testing (cURL)
```bash
# Create a request
curl -X POST http://localhost:3000/api/time-off \
  -H "Content-Type: application/json" \
  -H "x-employee-id: test-user" \
  -d '{
    "start_date": "2024-03-15T00:00:00Z",
    "end_date": "2024-03-22T00:00:00Z",
    "reason": "Test vacation",
    "type": "vacation"
  }'
```

##### Automated Testing (Jest)
```bash
# Publisher API tests
cd publisher-api
npm test

# Consumer Service tests
cd consumer-service
npm test
```

### Environment Variables

#### Publisher API (.env)
```
NODE_ENV=development
PORT=3000
RABBITMQ_URL=amqp://guest:guest@localhost:5672
MONGODB_URL=mongodb://admin:password@localhost:27017/time_off?authSource=admin
CORS_ORIGIN=*
```

#### Consumer Service (.env)
```
NODE_ENV=development
RABBITMQ_URL=amqp://guest:guest@localhost:5672
MONGODB_URL=mongodb://admin:password@localhost:27017/time_off?authSource=admin
```

### Debugging

#### VS Code Debug Configuration
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Publisher API",
      "program": "${workspaceFolder}/publisher-api/src/index.js",
      "restart": true,
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Consumer Service",
      "program": "${workspaceFolder}/consumer-service/src/index.js",
      "restart": true,
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

#### Common Issues

**Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or find all npm processes
lsof -i -P -n | grep node
```

**RabbitMQ Connection Failed**
```bash
# Check if RabbitMQ is running
docker ps | grep rabbitmq

# View RabbitMQ logs
docker logs rabbitmq

# Restart RabbitMQ
docker restart rabbitmq
```

**MongoDB Connection Failed**
```bash
# Check if MongoDB is running
docker ps | grep mongodb

# Test connection
mongosh -u admin -p password --authenticationDatabase admin

# Restart MongoDB
docker restart mongodb
```

### Performance Profiling

#### Node.js Profiling
```bash
# Start with profiling enabled
node --prof src/index.js

# Generate profile report
node --prof-process isolate-0x*.log > profile.txt

# View report
cat profile.txt
```

#### Memory Leaks
```bash
# Install clinic.js
npm install -g clinic

# Profile for memory leaks
clinic doctor -- node src/index.js

# View in browser
```

### Code Style

The project uses standard JavaScript conventions:
- 2-space indentation
- Semicolons required
- Double quotes for strings
- ES6 modules

Format your code:
```bash
# Using prettier (if installed)
npm run format

# Check code quality
npm run lint
```

### Git Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Description of changes"

# Push to remote
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

### Production Deployment

See README.md for production deployment guidelines.

---

**Last Updated**: January 2024
**Node.js Version**: 20+
**npm Version**: 9+
