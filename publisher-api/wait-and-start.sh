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

# Start the application
echo "Starting Publisher API..."
npm start
