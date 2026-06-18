#!/usr/bin/env node

// Simple wait-for-it alternative using Node.js
const net = require('net');
const { exec } = require('child_process');

async function waitForService(host, port, maxAttempts = 30) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const socket = net.createConnection(port, host);
        socket.setTimeout(1000);
        socket.on('connect', () => {
          socket.destroy();
          resolve();
        });
        socket.on('error', reject);
        socket.on('timeout', () => {
          socket.destroy();
          reject(new Error('Timeout'));
        });
      });
      console.log(`✓ ${host}:${port} is ready`);
      return;
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const remaining = maxAttempts - attempt;
      console.log(`  ⏳ Waiting for ${host}:${port} (${remaining} attempts remaining)...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function main() {
  console.log('Waiting for services to be ready...\n');
  
  try {
    // Wait for MongoDB
    console.log('Checking MongoDB...');
    await waitForService('mongodb', 27017, 30);
    
    // Wait for RabbitMQ
    console.log('Checking RabbitMQ...');
    await waitForService('rabbitmq', 5672, 30);
    
    console.log('\n✓ All services are ready!\n');
  } catch (error) {
    console.error('✗ Failed to connect to services:', error.message);
    process.exit(1);
  }
}

main();
