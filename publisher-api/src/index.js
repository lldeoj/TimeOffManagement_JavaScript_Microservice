import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { RabbitMQClient } from './rabbitmq.js';
import { MongoDBClient } from './database.js';
import { TimeOffService } from './timeOffService.js';
import { timeOffRequestSchema, updateTimeOffRequestSchema, validateRequest } from './validation.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parser
app.use(express.json());

// Global state
let mongoClient = null;
let rabbitMQ = null;
let timeOffService = null;

// Initialize connections
async function initializeConnections() {
  try {
    // Connect to MongoDB
    mongoClient = new MongoDBClient();
    await mongoClient.connect();

    // Connect to RabbitMQ
    rabbitMQ = new RabbitMQClient();
    await rabbitMQ.connect();

    // Initialize service
    const collection = mongoClient.getCollection();
    timeOffService = new TimeOffService(collection, rabbitMQ);

    console.log('✓ All services initialized successfully');
  } catch (error) {
    console.error('✗ Failed to initialize services:', error);
    process.exit(1);
  }
}

// Error handling middleware
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ============ ROUTES ============

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create time-off request
app.post('/api/time-off', asyncHandler(async (req, res) => {
  const validated = await validateRequest(req.body, timeOffRequestSchema);
  const employeeId = req.headers['x-employee-id'];

  if (!employeeId) {
    return res.status(401).json({ error: 'Missing x-employee-id header' });
  }

  const request = await timeOffService.createRequest(employeeId, validated);
  res.status(201).json({
    message: 'Time-off request created successfully',
    data: request
  });
}));

// Get all requests for employee
app.get('/api/time-off', asyncHandler(async (req, res) => {
  const employeeId = req.headers['x-employee-id'];

  if (!employeeId) {
    return res.status(401).json({ error: 'Missing x-employee-id header' });
  }

  const filters = {
    status: req.query.status,
    type: req.query.type,
    startDate: req.query.start_date,
    endDate: req.query.end_date
  };

  const requests = await timeOffService.listRequests(employeeId, filters);
  res.json({
    count: requests.length,
    data: requests
  });
}));

// Get specific request
app.get('/api/time-off/:id', asyncHandler(async (req, res) => {
  const employeeId = req.headers['x-employee-id'];

  if (!employeeId) {
    return res.status(401).json({ error: 'Missing x-employee-id header' });
  }

  const request = await timeOffService.getRequest(req.params.id, employeeId);
  res.json({ data: request });
}));

// Update request
app.put('/api/time-off/:id', asyncHandler(async (req, res) => {
  const employeeId = req.headers['x-employee-id'];

  if (!employeeId) {
    return res.status(401).json({ error: 'Missing x-employee-id header' });
  }

  const validated = await validateRequest(req.body, updateTimeOffRequestSchema);
  const request = await timeOffService.updateRequest(req.params.id, employeeId, validated);
  
  res.json({
    message: 'Request updated successfully',
    data: request
  });
}));

// Delete request
app.delete('/api/time-off/:id', asyncHandler(async (req, res) => {
  const employeeId = req.headers['x-employee-id'];

  if (!employeeId) {
    return res.status(401).json({ error: 'Missing x-employee-id header' });
  }

  const result = await timeOffService.deleteRequest(req.params.id, employeeId);
  res.json(result);
}));

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.message.startsWith('[')) {
    // Validation error
    try {
      const messages = JSON.parse(err.message);
      return res.status(400).json({ errors: messages });
    } catch (e) {}
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (mongoClient) await mongoClient.close();
  if (rabbitMQ) await rabbitMQ.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  if (mongoClient) await mongoClient.close();
  if (rabbitMQ) await rabbitMQ.close();
  process.exit(0);
});

// Start server
async function start() {
  await initializeConnections();
  
  app.listen(PORT, () => {
    console.log(`\n🚀 Publisher API running on http://localhost:${PORT}`);
    console.log('   Health check: http://localhost:${PORT}/health\n');
  });
}

start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
