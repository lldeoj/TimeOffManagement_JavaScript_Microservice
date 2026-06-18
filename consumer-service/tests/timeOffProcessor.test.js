// Tests for TimeOffProcessor
import { TimeOffProcessor } from '../src/timeOffProcessor.js';

class MockCollection {
  constructor() {
    this.data = new Map();
  }

  async insertOne(doc) {
    this.data.set(doc.request_id || doc._id, doc);
  }

  async updateOne(filter, update) {
    for (const [key, doc] of this.data) {
      if (doc._id === filter._id || doc.request_id === filter._id) {
        Object.assign(doc, update.$set);
        this.data.set(key, doc);
        return { modifiedCount: 1 };
      }
    }
    return { modifiedCount: 0 };
  }

  async findOne(filter) {
    for (const [, doc] of this.data) {
      if (doc._id === filter._id) {
        return doc;
      }
    }
    return null;
  }
}

describe('TimeOffProcessor', () => {
  let processor;
  let requestsCollection;
  let logsCollection;

  beforeEach(() => {
    requestsCollection = new MockCollection();
    logsCollection = new MockCollection();
    processor = new TimeOffProcessor(requestsCollection, logsCollection);
  });

  describe('processMessage', () => {
    test('should handle CREATE action', async () => {
      const message = {
        action: 'create',
        request_id: 'req-001',
        employee_id: 'emp-001',
        data: {
          _id: 'req-001',
          employee_id: 'emp-001',
          start_date: new Date('2024-03-15'),
          end_date: new Date('2024-03-22'),
          reason: 'Vacation',
          type: 'vacation',
          status: 'pending'
        }
      };

      await requestsCollection.insertOne(message.data);
      await processor.processMessage(message);

      const logs = Array.from(logsCollection.data.values());
      expect(logs.some(log => log.status === 'success')).toBe(true);
    });

    test('should handle UPDATE action', async () => {
      const message = {
        action: 'update',
        request_id: 'req-001',
        employee_id: 'emp-001',
        data: {
          _id: 'req-001',
          employee_id: 'emp-001',
          status: 'approved'
        }
      };

      const existingRequest = {
        _id: 'req-001',
        employee_id: 'emp-001',
        status: 'pending',
        start_date: new Date('2024-03-15'),
        end_date: new Date('2024-03-22')
      };

      await requestsCollection.insertOne(existingRequest);
      await processor.processMessage(message);

      const logs = Array.from(logsCollection.data.values());
      expect(logs.some(log => log.status === 'success')).toBe(true);
    });

    test('should handle DELETE action', async () => {
      const message = {
        action: 'delete',
        request_id: 'req-001',
        employee_id: 'emp-001'
      };

      const existingRequest = {
        _id: 'req-001',
        employee_id: 'emp-001',
        status: 'pending'
      };

      await requestsCollection.insertOne(existingRequest);
      await processor.processMessage(message);

      const logs = Array.from(logsCollection.data.values());
      expect(logs.some(log => log.status === 'success')).toBe(true);
    });

    test('should log processing errors', async () => {
      const message = {
        action: 'invalid_action',
        request_id: 'req-001',
        employee_id: 'emp-001'
      };

      await expect(processor.processMessage(message))
        .rejects
        .toThrow('Unknown action');
    });

    test('should create audit trail', async () => {
      const message = {
        action: 'create',
        request_id: 'req-001',
        employee_id: 'emp-001',
        data: {
          _id: 'req-001',
          employee_id: 'emp-001',
          status: 'pending'
        }
      };

      await requestsCollection.insertOne(message.data);
      await processor.processMessage(message);

      const logs = Array.from(logsCollection.data.values());
      const log = logs[0];
      
      expect(log.request_id).toBe('req-001');
      expect(log.action).toBe('create');
      expect(log.timestamp).toBeDefined();
    });
  });

  describe('handleCreate', () => {
    test('should mark request as processed', async () => {
      const requestId = 'req-001';
      const data = {
        _id: requestId,
        employee_id: 'emp-001',
        status: 'pending'
      };

      await requestsCollection.insertOne(data);
      await processor.handleCreate(requestId, data);

      const updated = await requestsCollection.findOne({ _id: requestId });
      expect(updated.processing_status).toBe('completed');
    });
  });

  describe('handleUpdate', () => {
    test('should update request with processed timestamp', async () => {
      const requestId = 'req-001';
      const data = {
        _id: requestId,
        status: 'approved'
      };

      const existing = {
        _id: requestId,
        employee_id: 'emp-001',
        status: 'pending'
      };

      await requestsCollection.insertOne(existing);
      await processor.handleUpdate(requestId, data);

      const updated = await requestsCollection.findOne({ _id: requestId });
      expect(updated.processed_at).toBeDefined();
    });
  });

  describe('handleDelete', () => {
    test('should mark request as deleted', async () => {
      const requestId = 'req-001';
      const employeeId = 'emp-001';

      const existing = {
        _id: requestId,
        employee_id: employeeId
      };

      await requestsCollection.insertOne(existing);
      await processor.handleDelete(requestId, employeeId);

      const updated = await requestsCollection.findOne({ _id: requestId });
      expect(updated.deleted_at).toBeDefined();
      expect(updated.deleted_by).toBe(employeeId);
    });
  });

  describe('logProcessing', () => {
    test('should create processing log entry', async () => {
      await processor.logProcessing('req-001', 'create', 'success', 'Test message');

      const logs = Array.from(logsCollection.data.values());
      expect(logs.length).toBe(1);
      
      const log = logs[0];
      expect(log.request_id).toBe('req-001');
      expect(log.action).toBe('create');
      expect(log.status).toBe('success');
      expect(log.message).toBe('Test message');
    });

    test('should include timestamp in log', async () => {
      const beforeTime = Date.now();
      await processor.logProcessing('req-001', 'update', 'success', 'Updated');
      const afterTime = Date.now();

      const logs = Array.from(logsCollection.data.values());
      const log = logs[0];
      
      expect(log.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime);
      expect(log.timestamp.getTime()).toBeLessThanOrEqual(afterTime);
    });
  });
});
