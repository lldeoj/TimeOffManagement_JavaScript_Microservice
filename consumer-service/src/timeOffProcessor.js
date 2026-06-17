// Business logic for processing time-off messages
export class TimeOffProcessor {
  constructor(requestsCollection, logsCollection) {
    this.requestsCollection = requestsCollection;
    this.logsCollection = logsCollection;
  }

  async processMessage(message) {
    const { action, request_id, employee_id, data } = message;

    console.log(`⚙️  Processing ${action} action for request ${request_id}`);

    try {
      switch (action) {
        case 'create':
          await this.handleCreate(request_id, data);
          break;
        case 'update':
          await this.handleUpdate(request_id, data);
          break;
        case 'delete':
          await this.handleDelete(request_id, employee_id);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Log successful processing
      await this.logProcessing(request_id, action, 'success', 'Message processed successfully');
      console.log(`✓ ${action} for request ${request_id} processed successfully`);
    } catch (error) {
      await this.logProcessing(request_id, action, 'error', error.message);
      console.error(`✗ Error processing ${action} for request ${request_id}: ${error.message}`);
      throw error;
    }
  }

  async handleCreate(requestId, data) {
    // Simulate some business logic
    // In a real system, this might send notifications, validate with external services, etc.

    const updatedData = {
      ...data,
      processed_at: new Date(),
      processing_status: 'completed'
    };

    await this.requestsCollection.updateOne(
      { _id: requestId },
      { $set: updatedData }
    );

    // Simulate sending notifications
    console.log(`📧 Notification sent to manager for request ${requestId}`);
  }

  async handleUpdate(requestId, data) {
    const updatedData = {
      ...data,
      processed_at: new Date()
    };

    await this.requestsCollection.updateOne(
      { _id: requestId },
      { $set: updatedData }
    );

    console.log(`📧 Update notification sent for request ${requestId}`);
  }

  async handleDelete(requestId, employeeId) {
    // Mark as deleted instead of hard delete for audit trail
    await this.requestsCollection.updateOne(
      { _id: requestId },
      { 
        $set: { 
          deleted_at: new Date(),
          deleted_by: employeeId
        }
      }
    );

    console.log(`🗑️  Request ${requestId} marked as deleted`);
  }

  async logProcessing(requestId, action, status, message) {
    await this.logsCollection.insertOne({
      request_id: requestId,
      action,
      status,
      message,
      timestamp: new Date()
    });
  }
}
