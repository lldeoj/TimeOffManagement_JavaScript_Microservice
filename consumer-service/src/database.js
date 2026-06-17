// Shared MongoDB utilities for consumer
import { MongoClient } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:password@localhost:27017/time_off?authSource=admin';
const DB_NAME = 'time_off';
const COLLECTION_NAME = 'requests';
const LOGS_COLLECTION_NAME = 'processing_logs';

export class MongoDBConsumer {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async connect() {
    try {
      this.client = new MongoClient(MONGODB_URL);
      await this.client.connect();
      this.db = this.client.db(DB_NAME);

      // Create indexes
      const logsCollection = this.db.collection(LOGS_COLLECTION_NAME);
      await logsCollection.createIndex({ request_id: 1 });
      await logsCollection.createIndex({ timestamp: -1 });

      console.log('✓ Consumer connected to MongoDB');
      return this.db;
    } catch (error) {
      console.error('✗ Failed to connect to MongoDB:', error.message);
      throw error;
    }
  }

  getRequestsCollection() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db.collection(COLLECTION_NAME);
  }

  getLogsCollection() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db.collection(LOGS_COLLECTION_NAME);
  }

  async close() {
    if (this.client) {
      await this.client.close();
      console.log('✓ Disconnected from MongoDB');
    }
  }
}

export { DB_NAME, COLLECTION_NAME, LOGS_COLLECTION_NAME };
