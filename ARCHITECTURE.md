# Project Structure and Architecture

## Directory Layout

```
time-off-microservice/
├── docker-compose.yml          # Docker Compose configuration for all services
├── Makefile                    # Convenient commands for development
├── .gitignore                  # Git ignore rules
├── README.md                   # Main documentation
├── DEVELOPMENT.md              # Development guide
├── EXAMPLES.md                 # API examples and test scenarios
│
├── publisher-api/              # REST API Service
│   ├── Dockerfile             # Docker image for API
│   ├── .dockerignore          # Files to ignore in Docker build
│   ├── .env.example           # Environment variables template
│   ├── package.json           # Node dependencies and scripts
│   └── src/
│       ├── index.js           # Express server and routes
│       ├── rabbitmq.js        # RabbitMQ client
│       ├── database.js        # MongoDB client
│       ├── timeOffService.js  # Business logic for CRUD
│       └── validation.js      # Request validation schemas
│
├── consumer-service/           # Async Message Consumer
│   ├── Dockerfile             # Docker image for consumer
│   ├── .dockerignore          # Files to ignore in Docker build
│   ├── .env.example           # Environment variables template
│   ├── package.json           # Node dependencies and scripts
│   └── src/
│       ├── index.js           # Consumer initialization
│       ├── rabbitmq.js        # RabbitMQ consumer client
│       ├── database.js        # MongoDB client for consumer
│       └── timeOffProcessor.js # Message processing logic
```

## Service Architecture

### 1. Publisher API Service
- **Port**: 3000
- **Role**: Receives HTTP requests from clients
- **Responsibilities**:
  - Validate incoming time-off requests
  - Perform conflict detection
  - Persist requests to MongoDB
  - Publish messages to RabbitMQ
  - Return responses to clients

**Key Files**:
- `index.js` - Express server with route handlers
- `timeOffService.js` - CRUD operations and conflict detection
- `validation.js` - Input validation

### 2. Consumer Service
- **Role**: Processes messages asynchronously
- **Responsibilities**:
  - Consume messages from RabbitMQ
  - Apply business logic to requests
  - Update MongoDB with processing results
  - Log processing events
  - Handle errors with retry logic

**Key Files**:
- `index.js` - Consumer initialization and message loop
- `timeOffProcessor.js` - Message handling logic

### 3. RabbitMQ
- **Port**: 5672 (AMQP)
- **Management UI**: 15672
- **Role**: Message broker for async communication
- **Configuration**:
  - Exchange: `time_off_exchange` (direct type)
  - Queue: `time_off_requests` (durable)
  - Routing Key: `time_off`

### 4. MongoDB
- **Port**: 27017
- **Database**: `time_off`
- **Collections**:
  - `requests` - Stores all time-off requests
  - `processing_logs` - Stores consumer processing events

## Data Flow

### Create Request Flow
```
Client
  │
  ├─ POST /api/time-off
  │
  ▼
Publisher API
  ├─ Validate request (Joi)
  ├─ Check conflicts (MongoDB query)
  ├─ Save to MongoDB (requests collection)
  │
  ├─ Publish to RabbitMQ
  │
  └─ Return 201 response
  
  ▼
RabbitMQ Queue
  │
  ├─ Message stored (durable)
  │
  ▼
Consumer Service
  ├─ Consume message
  ├─ Process (apply business logic)
  ├─ Update MongoDB (processed_at, status)
  ├─ Log processing (processing_logs collection)
  ├─ Acknowledge message
  │
  └─ Ready for next message
```

### Update Request Flow
```
Client
  │
  ├─ PUT /api/time-off/{id}
  │
  ▼
Publisher API
  ├─ Validate update data
  ├─ Check authorization
  ├─ Check conflicts (if dates changed)
  ├─ Update in MongoDB
  │
  ├─ Publish update message to RabbitMQ
  │
  └─ Return 200 response

  ▼
RabbitMQ Queue

  ▼
Consumer Service
  ├─ Process update
  ├─ Acknowledge message
```

## Message Format

### Create Message
```json
{
  "action": "create",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "employee_id": "emp-001",
  "data": {
    "_id": "550e8400-e29b-41d4-a716-446655440000",
    "employee_id": "emp-001",
    "start_date": "2024-03-15T00:00:00.000Z",
    "end_date": "2024-03-22T00:00:00.000Z",
    "reason": "Spring vacation",
    "type": "vacation",
    "status": "pending",
    "created_at": "2024-01-15T14:32:10.123Z"
  }
}
```

### Update Message
```json
{
  "action": "update",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "employee_id": "emp-001",
  "data": {
    "_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "approved",
    "updated_at": "2024-01-15T15:45:20.456Z"
  }
}
```

### Delete Message
```json
{
  "action": "delete",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "employee_id": "emp-001"
}
```

## Database Schema

### Requests Collection
```javascript
{
  _id: String (UUID),
  employee_id: String,
  start_date: Date,
  end_date: Date,
  reason: String,
  type: String,          // "vacation", "sick_leave", "personal", "unpaid"
  status: String,        // "pending", "approved", "rejected"
  notes: String,
  created_at: Date,
  updated_at: Date,
  processed_at: Date,    // Set by consumer
  deleted_at: Date,      // Set for soft deletes
  deleted_by: String     // Employee ID of deleter
}

// Indexes:
// - { employee_id: 1, start_date: 1, end_date: 1 } (for conflict detection)
// - { status: 1 } (for filtering)
// - { created_at: -1 } (for sorting)
```

### Processing Logs Collection
```javascript
{
  _id: ObjectId,
  request_id: String,
  action: String,        // "create", "update", "delete"
  status: String,        // "success", "error"
  message: String,
  timestamp: Date
}

// Indexes:
// - { request_id: 1 } (for querying logs for a request)
// - { timestamp: -1 } (for sorting)
```

## API Endpoints Summary

| Method | Endpoint | Action | Auth |
|--------|----------|--------|------|
| POST | `/api/time-off` | Create request | ✓ |
| GET | `/api/time-off` | List requests | ✓ |
| GET | `/api/time-off/{id}` | Get request | ✓ |
| PUT | `/api/time-off/{id}` | Update request | ✓ |
| DELETE | `/api/time-off/{id}` | Delete request | ✓ |
| GET | `/health` | Health check | ✗ |

## Security Measures

### Implemented
✅ Input validation (Joi)
✅ Employee ID authorization (header)
✅ Authorization checks (only manage own requests)
✅ Helmet middleware (security headers)
✅ CORS configuration
✅ Error handling (no stack traces)
✅ Message acknowledgment (no message loss)

### Recommended for Production
⚠️ JWT/OAuth2 authentication
⚠️ HTTPS/TLS
⚠️ Rate limiting
⚠️ Centralized logging
⚠️ Secrets management
⚠️ Database authentication
⚠️ Monitoring and alerting

## Performance Characteristics

| Operation | Typical Time |
|-----------|--------------|
| Create request | ~50ms |
| List requests | ~30-50ms |
| Get request | ~20ms |
| Update request | ~40ms |
| Delete request | ~30ms |
| Message processing | ~100ms |
| Conflict detection | ~20ms |

## Scaling Considerations

### Horizontal Scaling
- **Publisher API**: Stateless, can be scaled behind a load balancer
- **Consumer Service**: Multiple instances for parallel message processing
- **RabbitMQ**: Configure clustering for high availability
- **MongoDB**: Implement sharding for large datasets

### Vertical Scaling
- Increase CPU/memory for Publisher API if many concurrent requests
- Increase memory for Consumer Service if processing many messages
- Increase RabbitMQ memory for large message queues

## Monitoring Checklist

- [ ] API response times
- [ ] Message queue depth
- [ ] Consumer processing lag
- [ ] Database query performance
- [ ] Error rates
- [ ] Service uptime
- [ ] Memory usage
- [ ] Disk space (MongoDB, RabbitMQ)

## Deployment Considerations

### Docker Compose (Development/Testing)
- Quick setup
- All services in one command
- Reproduces production environment
- Volume management built-in

### Production Deployment
- Use Kubernetes or Docker Swarm for orchestration
- Separate database and message queue infrastructure
- Implement proper backup and recovery
- Use managed services (AWS, GCP, Azure)
- Set up monitoring and alerting
- Implement CI/CD pipelines
- Use secrets management

## Development Tips

1. **Use Makefile commands** for common tasks
2. **Monitor logs** with `docker-compose logs -f`
3. **Test APIs** with provided EXAMPLES.md
4. **Check RabbitMQ** via Management UI (localhost:15672)
5. **Inspect MongoDB** with mongosh or MongoDB Compass
6. **Hot reload** - Changes auto-apply with nodemon
7. **Environment variables** - Copy `.env.example` to `.env`

## Common Tasks

### Add New Request Type
1. Update enum in `validation.js`
2. Update processing logic in `timeOffProcessor.js`
3. Test with API

### Add New Field to Request
1. Add to validation schema
2. Update MongoDB indexes if searching/sorting
3. Update API documentation

### Debug Message Processing
1. Check RabbitMQ UI for queue depth
2. Check Consumer Service logs
3. Query MongoDB `processing_logs` collection

## Resources

- [Express.js](https://expressjs.com/)
- [RabbitMQ](https://www.rabbitmq.com/)
- [MongoDB](https://www.mongodb.com/)
- [Docker](https://www.docker.com/)
- [Node.js](https://nodejs.org/)

---

**Version**: 1.0.0
**Last Updated**: January 2024
