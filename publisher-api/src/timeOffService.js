// Business logic for Time-Off requests
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

export class TimeOffService {
  constructor(mongoCollection, rabbitMQ) {
    this.collection = mongoCollection;
    this.rabbitMQ = rabbitMQ;
  }

  async createRequest(employeeId, data) {
    // Check for conflicts with existing requests
    const existingConflict = await this.checkDateConflicts(
      employeeId,
      new Date(data.start_date),
      new Date(data.end_date),
      null
    );

    if (existingConflict) {
      throw new Error(
        `Conflict detected: You already have a time-off request from ${existingConflict.start_date.toISOString().split('T')[0]} to ${existingConflict.end_date.toISOString().split('T')[0]}`
      );
    }

    // Validate date range
    if (new Date(data.start_date) >= new Date(data.end_date)) {
      throw new Error('Start date must be before end date');
    }

    const request = {
      _id: uuidv4(),
      employee_id: employeeId,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
      reason: data.reason,
      type: data.type,
      status: 'pending',
      notes: '',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Save to database
    await this.collection.insertOne(request);

    // Publish message to RabbitMQ
    await this.rabbitMQ.publishMessage({
      action: 'create',
      request_id: request._id,
      employee_id: employeeId,
      data: request
    });

    return request;
  }

  async updateRequest(requestId, employeeId, updates) {
    const existing = await this.collection.findOne({ _id: requestId });
    
    if (!existing) {
      throw new Error('Request not found');
    }

    if (existing.employee_id !== employeeId) {
      throw new Error('Unauthorized: Cannot update other employee\'s request');
    }

    // If dates are being updated, check for conflicts
    if (updates.start_date || updates.end_date) {
      const startDate = new Date(updates.start_date || existing.start_date);
      const endDate = new Date(updates.end_date || existing.end_date);

      const existingConflict = await this.checkDateConflicts(
        employeeId,
        startDate,
        endDate,
        requestId
      );

      if (existingConflict) {
        throw new Error(
          `Conflict detected: You already have a time-off request from ${existingConflict.start_date.toISOString().split('T')[0]} to ${existingConflict.end_date.toISOString().split('T')[0]}`
        );
      }
    }

    const updatedRequest = {
      ...existing,
      ...updates,
      updated_at: new Date()
    };

    await this.collection.updateOne(
      { _id: requestId },
      { $set: updatedRequest }
    );

    // Publish message to RabbitMQ
    await this.rabbitMQ.publishMessage({
      action: 'update',
      request_id: requestId,
      employee_id: employeeId,
      data: updatedRequest
    });

    return updatedRequest;
  }

  async deleteRequest(requestId, employeeId) {
    const existing = await this.collection.findOne({ _id: requestId });
    
    if (!existing) {
      throw new Error('Request not found');
    }

    if (existing.employee_id !== employeeId) {
      throw new Error('Unauthorized: Cannot delete other employee\'s request');
    }

    await this.collection.deleteOne({ _id: requestId });

    // Publish message to RabbitMQ
    await this.rabbitMQ.publishMessage({
      action: 'delete',
      request_id: requestId,
      employee_id: employeeId
    });

    return { success: true, message: 'Request deleted successfully' };
  }

  async listRequests(employeeId, filters = {}) {
    const query = { employee_id: employeeId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.startDate || filters.endDate) {
      query.start_date = {};
      if (filters.startDate) {
        query.start_date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.start_date.$lte = new Date(filters.endDate);
      }
    }

    const requests = await this.collection
      .find(query)
      .sort({ created_at: -1 })
      .toArray();

    return requests;
  }

  async getRequest(requestId, employeeId) {
    const request = await this.collection.findOne({ _id: requestId });

    if (!request) {
      throw new Error('Request not found');
    }

    if (request.employee_id !== employeeId) {
      throw new Error('Unauthorized: Cannot access other employee\'s request');
    }

    return request;
  }

  async checkDateConflicts(employeeId, startDate, endDate, excludeRequestId = null) {
    const query = {
      employee_id: employeeId,
      status: { $ne: 'rejected' },
      $or: [
        { start_date: { $lt: endDate, $gte: startDate } },
        { end_date: { $gt: startDate, $lte: endDate } },
        { start_date: { $lte: startDate }, end_date: { $gte: endDate } }
      ]
    };

    if (excludeRequestId) {
      query._id = { $ne: excludeRequestId };
    }

    return await this.collection.findOne(query);
  }
}
