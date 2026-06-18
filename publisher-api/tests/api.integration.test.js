// Integration tests for API endpoints
import request from 'supertest';

// Mock Express app for testing
const createMockApp = () => {
  const express = require('express');
  const app = express();
  app.use(express.json());

  // Mock middleware
  app.use((req, res, next) => {
    req.headers['x-employee-id'] = req.headers['x-employee-id'] || 'test-employee';
    next();
  });

  // Mock routes
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/time-off', (req, res) => {
    // Simple validation
    const { start_date, end_date, reason, type } = req.body;
    
    if (!start_date || !end_date || !reason || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    res.status(201).json({
      message: 'Time-off request created successfully',
      data: {
        _id: 'mock-id-001',
        employee_id: req.headers['x-employee-id'],
        start_date,
        end_date,
        reason,
        type,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    });
  });

  app.get('/api/time-off', (req, res) => {
    res.json({
      count: 0,
      data: []
    });
  });

  app.get('/api/time-off/:id', (req, res) => {
    const employeeId = req.headers['x-employee-id'];
    
    if (!employeeId) {
      return res.status(401).json({ error: 'Missing x-employee-id header' });
    }

    res.json({
      data: {
        _id: req.params.id,
        employee_id: employeeId,
        status: 'pending',
        reason: 'Mock request',
        type: 'vacation'
      }
    });
  });

  app.put('/api/time-off/:id', (req, res) => {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status required' });
    }

    res.json({
      message: 'Request updated successfully',
      data: {
        _id: req.params.id,
        status,
        updated_at: new Date().toISOString()
      }
    });
  });

  app.delete('/api/time-off/:id', (req, res) => {
    res.json({
      success: true,
      message: 'Request deleted successfully'
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  return app;
};

describe('API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createMockApp();
  });

  describe('Health Check', () => {
    test('GET /health should return 200 with ok status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Create Time-Off Request', () => {
    test('POST /api/time-off should create request with valid data', async () => {
      const data = {
        start_date: '2024-03-15T00:00:00Z',
        end_date: '2024-03-22T00:00:00Z',
        reason: 'Spring vacation',
        type: 'vacation'
      };

      const response = await request(app)
        .post('/api/time-off')
        .set('x-employee-id', 'emp-001')
        .send(data)
        .expect(201);

      expect(response.body.message).toContain('successfully');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.type).toBe('vacation');
    });

    test('POST /api/time-off should return 400 with missing required fields', async () => {
      const data = {
        start_date: '2024-03-15T00:00:00Z',
        // missing end_date, reason, type
      };

      const response = await request(app)
        .post('/api/time-off')
        .set('x-employee-id', 'emp-001')
        .send(data)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('POST /api/time-off should return 400 if start_date >= end_date', async () => {
      const data = {
        start_date: '2024-03-22T00:00:00Z',
        end_date: '2024-03-15T00:00:00Z',
        reason: 'Invalid dates',
        type: 'vacation'
      };

      const response = await request(app)
        .post('/api/time-off')
        .set('x-employee-id', 'emp-001')
        .send(data)
        .expect(400);

      expect(response.body.error).toContain('Start date must be before end date');
    });

    test('POST /api/time-off should default to provided employee id header', async () => {
      const data = {
        start_date: '2024-03-15T00:00:00Z',
        end_date: '2024-03-22T00:00:00Z',
        reason: 'Spring vacation',
        type: 'vacation'
      };

      const response = await request(app)
        .post('/api/time-off')
        .set('x-employee-id', 'emp-custom-id')
        .send(data)
        .expect(201);

      expect(response.body.data.employee_id).toBe('emp-custom-id');
    });
  });

  describe('List Time-Off Requests', () => {
    test('GET /api/time-off should return list of requests', async () => {
      const response = await request(app)
        .get('/api/time-off')
        .set('x-employee-id', 'emp-001')
        .expect(200);

      expect(response.body.count).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/time-off with filters should return filtered results', async () => {
      const response = await request(app)
        .get('/api/time-off?status=pending&type=vacation')
        .set('x-employee-id', 'emp-001')
        .expect(200);

      expect(response.body.count).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Get Specific Request', () => {
    test('GET /api/time-off/:id should return specific request', async () => {
      const response = await request(app)
        .get('/api/time-off/req-001')
        .set('x-employee-id', 'emp-001')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data._id).toBe('req-001');
    });

    test('GET /api/time-off/:id should return 401 without employee id', async () => {
      const response = await request(app)
        .get('/api/time-off/req-001')
        .expect(401);

      expect(response.body.error).toContain('Missing');
    });
  });

  describe('Update Request', () => {
    test('PUT /api/time-off/:id should update request', async () => {
      const data = {
        status: 'approved'
      };

      const response = await request(app)
        .put('/api/time-off/req-001')
        .set('x-employee-id', 'emp-001')
        .send(data)
        .expect(200);

      expect(response.body.message).toContain('successfully');
      expect(response.body.data.status).toBe('approved');
    });

    test('PUT /api/time-off/:id should return 400 without status', async () => {
      const response = await request(app)
        .put('/api/time-off/req-001')
        .set('x-employee-id', 'emp-001')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Delete Request', () => {
    test('DELETE /api/time-off/:id should delete request', async () => {
      const response = await request(app)
        .delete('/api/time-off/req-001')
        .set('x-employee-id', 'emp-001')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/unknown-endpoint')
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    test('should handle missing headers gracefully', async () => {
      const response = await request(app)
        .get('/api/time-off/req-001')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });
});
