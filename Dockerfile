# This Dockerfile is optimized for deploying the long-running RabbitMQ consumer worker.
# It uses a single-stage build approach tailored for running TypeScript directly
# when the multi-stage build's 'npm run build' step is problematic.

# Using node:20-slim for a stable base
FROM node:20-slim

WORKDIR /app

# 1. Copy package files
COPY package*.json ./

# 2. Install dependencies, including TypeScript runtime tools (ts-node, typescript)
# We need to install ALL dependencies here since we are not using a builder stage anymore.
RUN npm install --legacy-peer-deps

# 3. Copy all source code (including rabbitmq-consumer.ts and cassandra.ts)
COPY . .

# Define required environment variables. These MUST be overridden at deployment time.
# NOTE: The application's 'cassandra.ts' must be updated to use CASSANDRA_TOKEN/ENDPOINT
# if it's currently looking for ASTRA_DB_...
ENV RABBITMQ_QUEUE="order-events"
ENV RABBITMQ_URL="REQUIRED_RABBITMQ_URL_HERE"
ENV CASSANDRA_ENDPOINT="REQUIRED_ENDPOINT_HERE"
ENV CASSANDRA_TOKEN="REQUIRED_TOKEN_HERE"
ENV CASSANDRA_KEYSPACE="smart_orders"
ENV MONGODB_URI="REQUIRED_MONGO_URI_HERE"
ENV REDIS_URI="REQUIRED_REDIS_URI_HERE"

# CRITICAL: The command to start the long-running worker process.
# We execute the consumer file directly using npx ts-node.
# Assuming your main file is located at lib/db/rabbitmq-consumer.ts based on typical project structure.
CMD ["npx", "ts-node", "lib/db/rabbitmq-consumer.ts"]
