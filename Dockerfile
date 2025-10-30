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
# --- NON-SENSITIVE CONFIGURATION VARIABLES ---
# These variables define structural configuration and are safe to be in the image.
ENV RABBITMQ_QUEUE="order-events"
ENV CASSANDRA_KEYSPACE="smart_orders"

# --- SENSITIVE VARIABLES REMOVED FROM ENV ---
# RABBITMQ_URL, CASSANDRA_ENDPOINT, CASSANDRA_TOKEN, MONGODB_URI, REDIS_URI
# These must be injected using 'docker run -e' or a managed deployment tool.

# CRITICAL: The command to start the long-running worker process.
# FIX: Use 'node --loader ts-node/esm' to instruct Node.js to use ts-node as a module loader,
# which correctly handles the .ts extension and import/export syntax.
CMD ["node", "--loader", "ts-node/esm", "/app/lib/db/rabbitmq-consumer.ts"]
