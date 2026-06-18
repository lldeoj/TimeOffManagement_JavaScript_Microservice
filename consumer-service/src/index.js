import { RabbitMQConsumer } from './rabbitmq.js';
import { MongoDBConsumer } from './database.js';
import { TimeOffProcessor } from './timeOffProcessor.js';

let rabbitMQ = null;
let mongoClient = null;
let processor = null;

// Retry logic for connection failures
async function retryConnection(fn, maxRetries = 60, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const remaining = maxRetries - attempt;
      console.log(`  ⏳ Retry ${attempt}/${maxRetries} (${remaining} remaining) - ${error.code || error.message}`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

async function initializeConnections() {
  try {
    // Connect to RabbitMQ with retries
    console.log('Connecting to RabbitMQ...');
    rabbitMQ = new RabbitMQConsumer();
    await retryConnection(() => rabbitMQ.connect());

    // Connect to MongoDB with retries
    console.log('Connecting to MongoDB...');
    mongoClient = new MongoDBConsumer();
    await retryConnection(() => mongoClient.connect());

    // Initialize processor
    const requestsCollection = mongoClient.getRequestsCollection();
    const logsCollection = mongoClient.getLogsCollection();
    processor = new TimeOffProcessor(requestsCollection, logsCollection);

    console.log('✓ Consumer service initialized successfully\n');
  } catch (error) {
    console.error('✗ Failed to initialize consumer:', error.message);
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
