import { RabbitMQConsumer } from './rabbitmq.js';
import { MongoDBConsumer } from './database.js';
import { TimeOffProcessor } from './timeOffProcessor.js';

let rabbitMQ = null;
let mongoClient = null;
let processor = null;

async function initializeConnections() {
  try {
    // Connect to RabbitMQ
    rabbitMQ = new RabbitMQConsumer();
    await rabbitMQ.connect();

    // Connect to MongoDB
    mongoClient = new MongoDBConsumer();
    await mongoClient.connect();

    // Initialize processor
    const requestsCollection = mongoClient.getRequestsCollection();
    const logsCollection = mongoClient.getLogsCollection();
    processor = new TimeOffProcessor(requestsCollection, logsCollection);

    console.log('✓ Consumer service initialized successfully\n');
  } catch (error) {
    console.error('✗ Failed to initialize consumer:', error);
    process.exit(1);
  }
}

async function startConsumer() {
  try {
    await rabbitMQ.consumeMessages(async (message) => {
      await processor.processMessage(message);
    });

    console.log('🎧 Listening for messages...\n');
  } catch (error) {
    console.error('✗ Error starting consumer:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\nSIGTERM received, shutting down gracefully...');
  if (rabbitMQ) await rabbitMQ.close();
  if (mongoClient) await mongoClient.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  if (rabbitMQ) await rabbitMQ.close();
  if (mongoClient) await mongoClient.close();
  process.exit(0);
});

// Start consumer
async function start() {
  console.log('🚀 Starting Time-Off Consumer Service\n');
  await initializeConnections();
  await startConsumer();
}

start().catch(error => {
  console.error('Failed to start consumer:', error);
  process.exit(1);
});
