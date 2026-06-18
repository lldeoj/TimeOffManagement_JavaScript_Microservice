#!/bin/bash

# Wait for RabbitMQ
echo "Waiting for RabbitMQ..."
until nc -z rabbitmq 5672; do
  sleep 1
done
echo "RabbitMQ is ready"

# Wait for MongoDB
echo "Waiting for MongoDB..."
until nc -z mongodb 27017; do
  sleep 1
done
echo "MongoDB is ready"

# Wait for Publisher API to be ready
echo "Waiting for Publisher API..."
until curl -sf http://publisher-api:3000/health > /dev/null 2>&1; do
  sleep 1
done
echo "Publisher API is ready"

# Start the consumer service
echo "Starting Consumer Service..."
npm start
