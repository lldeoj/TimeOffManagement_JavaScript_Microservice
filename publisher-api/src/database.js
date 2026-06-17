// MongoDB connection and initialization
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:password@localhost:27017/time_off?authSource=admin';
const DB_NAME = 'time_off';
const COLLECTION_NAME = 'requests';

export class MongoDBClient {
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
      const collection = this.db.collection(COLLECTION_NAME);
      await collection.createIndex({ employee_id: 1, start_date: 1, end_date: 1 });
      await collection.createIndex({ status: 1 });
      await collection.createIndex({ created_at: -1 });

      console.log('✓ Connected to MongoDB');
      return this.db;
    } catch (error) {
      console.error('✗ Failed to connect to MongoDB:', error.message);
      throw error;
    }
  }

  getCollection() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db.collection(COLLECTION_NAME);
  }

  async close() {
    if (this.client) {
      await this.client.close();
      console.log('✓ Disconnected from MongoDB');
    }
  }
}

export { DB_NAME, COLLECTION_NAME, ObjectId };
