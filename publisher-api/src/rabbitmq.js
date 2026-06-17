// Config and utilities for RabbitMQ connection
import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const QUEUE_NAME = 'time_off_requests';
const EXCHANGE_NAME = 'time_off_exchange';

export class RabbitMQClient {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      
      // Setup exchange and queue
      await this.channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
      await this.channel.assertQueue(QUEUE_NAME, { durable: true });
      await this.channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'time_off');

      console.log('✓ Connected to RabbitMQ');
      return this.channel;
    } catch (error) {
      console.error('✗ Failed to connect to RabbitMQ:', error.message);
      throw error;
    }
  }

  async publishMessage(message) {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }
    
    const messageContent = Buffer.from(JSON.stringify(message));
    const published = this.channel.publish(
      EXCHANGE_NAME,
      'time_off',
      messageContent,
      { 
        persistent: true,
        contentType: 'application/json',
        timestamp: Date.now()
      }
    );

    if (!published) {
      throw new Error('Failed to publish message');
    }

    return published;
  }

  async consumeMessages(callback) {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    await this.channel.prefetch(1);
    
    await this.channel.consume(QUEUE_NAME, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await callback(content);
          this.channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          this.channel.nack(msg, false, true);
        }
      }
    });
  }

  async close() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    console.log('✓ Disconnected from RabbitMQ');
  }
}

export { QUEUE_NAME, EXCHANGE_NAME };
