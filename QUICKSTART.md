# Quick Start Guide

## 🚀 Get Started in 2 Minutes

### Prerequisites
- Docker & Docker Compose installed
- Port 3000, 5672, 15672, 27017 available

### Start the Service

```bash
# Navigate to project
cd time-off-microservice

# Start all services
docker-compose up --build

# Wait for services to initialize (~10 seconds)
```

### Test the API

In a new terminal:

```bash
# Test health
curl http://localhost:3000/health

# Create a time-off request
curl -X POST http://localhost:3000/api/time-off \
  -H "Content-Type: application/json" \
  -H "x-employee-id: john-doe" \
  -d '{
    "start_date": "2024-03-15T00:00:00Z",
    "end_date": "2024-03-22T00:00:00Z",
    "reason": "Spring vacation",
    "type": "vacation"
  }'

# List all requests
curl http://localhost:3000/api/time-off \
  -H "x-employee-id: john-doe"
```

## 🔍 Monitor Services

```bash
# View logs
docker-compose logs -f

# RabbitMQ Management UI
# http://localhost:15672 (user: guest, pass: guest)

# List running containers
docker-compose ps
```

## 📚 Documentation

- **README.md** - Full documentation
- **EXAMPLES.md** - API request examples
- **DEVELOPMENT.md** - Development guide
- **ARCHITECTURE.md** - System architecture

## 🛑 Stop Services

```bash
# Stop and remove containers
docker-compose down

# Stop but keep containers
docker-compose stop
```

## 📋 System Components

| Component | URL | Purpose |
|-----------|-----|---------|
| Publisher API | http://localhost:3000 | REST API for time-off management |
| RabbitMQ | http://localhost:15672 | Message queue (UI) |
| MongoDB | localhost:27017 | Data storage |

## ⚡ Common Commands

```bash
# See all available Makefile commands
make help

# Start services
make start

# View logs
make logs

# Stop services
make stop

# Health check
make health

# Test API
make test-create
make test-list
```

## 🐛 Troubleshooting

**Services won't start?**
- Check if ports are in use: `docker ps`
- Free port: `lsof -ti:3000 | xargs kill -9`

**RabbitMQ not responding?**
- Check logs: `docker-compose logs rabbitmq`
- Restart: `docker-compose restart rabbitmq`

**Need to reset database?**
- Remove volumes: `docker-compose down -v`
- Start fresh: `docker-compose up --build`

## 📖 Next Steps

1. Read [README.md](README.md) for full documentation
2. Check [EXAMPLES.md](EXAMPLES.md) for API examples
3. Review [ARCHITECTURE.md](ARCHITECTURE.md) for design details
4. See [DEVELOPMENT.md](DEVELOPMENT.md) for local development

---

**Happy coding! 🎉**
