// Tests for validation.js
import { timeOffRequestSchema, updateTimeOffRequestSchema, validateRequest } from '../src/validation.js';

describe('Validation - timeOffRequestSchema', () => {
  describe('Valid requests', () => {
    test('should validate a valid time-off request', async () => {
      const data = {
        employee_id: 'emp-001',
        start_date: '2024-03-15T00:00:00Z',
        end_date: '2024-03-22T00:00:00Z',
        reason: 'Spring vacation',
        type: 'vacation'
      };

      const result = await validateRequest(data, timeOffRequestSchema);
      expect(result).toBeDefined();
      expect(result.reason).toBe('Spring vacation');
      expect(result.type).toBe('vacation');
    });

    test('should validate with maximum reason length', async () => {
      const data = {
        employee_id: 'emp-001',
        start_date: '2024-03-15T00:00:00Z',
        end_date: '2024-03-22T00:00:00Z',
        reason: 'A'.repeat(500),
        type: 'vacation'
      };

      const result = await validateRequest(data, timeOffRequestSchema);
      expect(result.reason.length).toBe(500);
    });

    test('should validate all request types', async () => {
      const types = ['vacation', 'sick_leave', 'personal', 'unpaid'];

      for (const type of types) {
        const data = {
          employee_id: 'emp-001',
          start_date: '2024-03-15T00:00:00Z',
          end_date: '2024-03-22T00:00:00Z',
          reason: 'Valid reason for time off',
          type
        };

        const result = await validateRequest(data, timeOffRequestSchema);
        expect(result.type).toBe(type);
      }
    });
  });

  describe('Invalid requests', () => {
    test('should reject request with missing employee_id', async () => {
      const data = {
        start_date: '2024-03-15T00:00:00Z',
        end_date: '2024-03-22T00:00:00Z',
        reason: 'Spring vacation',
        type: 'vacation'
      };

      await expect(validateRequest(data, timeOffRequestSchema))
        .rejects
        .toThrow();
    });

    test('should reject request with invalid date format', async () => {
      const data = {
        employee_id: 'emp-001',
        start_date: 'invalid-date',
        end_date: '2024-03-22T00:00:00Z',
        reason: 'Spring vacation',
        type: 'vacation'
      };

      await expect(validateRequest(data, timeOffRequestSchema))
        .rejects
        .toThrow();
    });

    test('should reject request with reason too short', async () => {
      const data = {
        employee_id: 'emp-001',
        start_date: '2024-03-15T00:00:00Z',
        end_date: '2024-03-22T00:00:00Z',
        reason: 'Bad',
        type: 'vacation'
      };

      await expect(validateRequest(data, timeOffRequestSchema))
        .rejects
        .toThrow('at least 5 characters');
    });

    test('should reject request with reason too long', async () => {
      const data = {
        employee_id: 'emp-001',
        start_date: '2024-03-15T00:00:00Z',
        end_date: '2024-03-22T00:00:00Z',
        reason: 'A'.repeat(501),
        type: 'vacation'
      };

      await expect(validateRequest(data, timeOffRequestSchema))
        .rejects
        .toThrow('not exceed 500 characters');
    });

    test('should reject request with invalid type', async () => {
      const data = {
        employee_id: 'emp-001',
        start_date: '2024-03-15T00:00:00Z',
        end_date: '2024-03-22T00:00:00Z',
        reason: 'Spring vacation',
        type: 'invalid_type'
      };

      await expect(validateRequest(data, timeOffRequestSchema))
        .rejects
        .toThrow('one of');
    });

    test('should reject request with missing end_date', async () => {
      const data = {
        employee_id: 'emp-001',
        start_date: '2024-03-15T00:00:00Z',
        reason: 'Spring vacation',
        type: 'vacation'
      };

      await expect(validateRequest(data, timeOffRequestSchema))
        .rejects
        .toThrow();
    });
  });

  describe('Update request schema', () => {
    test('should validate status update', async () => {
      const data = {
        status: 'approved'
      };

      const result = await validateRequest(data, updateTimeOffRequestSchema);
      expect(result.status).toBe('approved');
    });

    test('should validate notes update', async () => {
      const data = {
        notes: 'Approved by manager'
      };

      const result = await validateRequest(data, updateTimeOffRequestSchema);
      expect(result.notes).toBe('Approved by manager');
    });

    test('should validate both status and notes', async () => {
      const data = {
        status: 'rejected',
        notes: 'Not approved'
      };

      const result = await validateRequest(data, updateTimeOffRequestSchema);
      expect(result.status).toBe('rejected');
      expect(result.notes).toBe('Not approved');
    });

    test('should reject invalid status', async () => {
      const data = {
        status: 'invalid_status'
      };

      await expect(validateRequest(data, updateTimeOffRequestSchema))
        .rejects
        .toThrow();
    });

    test('should reject empty object', async () => {
      const data = {};

      await expect(validateRequest(data, updateTimeOffRequestSchema))
        .rejects
        .toThrow();
    });
  });
});
