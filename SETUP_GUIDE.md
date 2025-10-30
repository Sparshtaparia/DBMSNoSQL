# Smart Order Processing System - Setup Guide

## Overview

This is a complete polyglot persistence demonstration using:
- **MongoDB** - Document store for orders
- **Redis** - Cache layer for fast access
- **Cassandra** - Distributed analytics database
- **Kafka** - Event streaming and message broker
- **Next.js** - Full-stack application
- **Docker** - Containerization

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- 4GB+ RAM available

## Quick Start

### Option 1: Docker Compose (Recommended for Seminar)

\`\`\`bash
# Clone or navigate to project directory
cd smart-order-system

# Start all services
docker-compose up -d

# Wait for services to be healthy (60-90 seconds)
docker-compose ps

# Open browser
open http://localhost:3000
\`\`\`

### Option 2: Local Development

\`\`\`bash
# Install dependencies
npm install

# Start databases with Docker Compose (without the app)
docker-compose up -d mongodb redis cassandra kafka zookeeper

# Wait for services to be healthy
docker-compose ps

# In another terminal, start the Next.js app
npm run dev

# Open browser
open http://localhost:3000
\`\`\`

## Architecture

### Data Flow

\`\`\`
[React Frontend]
       ↓ (HTTP POST)
[Next.js API Route]
       ↓
┌─────────────────────────────────────────┐
│ 1. MongoDB (Document Store)             │
│    - Stores complete order documents    │
│    - Primary data source                │
└─────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│ 2. Redis (Cache Layer)                  │
│    - Caches recent orders               │
│    - 1-hour TTL                         │
│    - Speeds up GET /api/orders          │
└─────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│ 3. Kafka (Event Broker)                 │
│    - Publishes order-events topic       │
│    - Asynchronous processing            │
└─────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────┐
│ 4. Cassandra (Analytics Store)          │
│    - Kafka consumer updates analytics   │
│    - Stores aggregated data             │
│    - Distributed time-series data       │
└─────────────────────────────────────────┘
\`\`\`

## API Endpoints

### Create Order
\`\`\`bash
POST /api/orders
Content-Type: application/json

{
  "customerName": "John Doe",
  "itemName": "Laptop",
  "quantity": 1,
  "price": 999.99
}

Response:
{
  "success": true,
  "order": {
    "id": "ORD-1730000000000",
    "customerName": "John Doe",
    "itemName": "Laptop",
    "quantity": 1,
    "price": 999.99,
    "total": 999.99,
    "createdAt": "2024-10-30T12:00:00.000Z"
  },
  "pipeline": {
    "mongodb": "Stored ✓",
    "redis": "Cached ✓",
    "kafka": "Event published ✓",
    "cassandra": "Will be updated by Kafka listener"
  }
}
\`\`\`

### Get Orders
\`\`\`bash
GET /api/orders

Response:
{
  "orders": [
    {
      "id": "ORD-1730000000000",
      "customerName": "John Doe",
      "itemName": "Laptop",
      "quantity": 1,
      "price": 999.99,
      "total": 999.99,
      "createdAt": "2024-10-30T12:00:00.000Z",
      "source": "redis"  # or "mongodb"
    }
  ],
  "source": "redis",
  "count": 1,
  "timestamp": "2024-10-30T12:00:00.000Z"
}
\`\`\`

### Get Analytics
\`\`\`bash
GET /api/analytics

Response:
{
  "totalOrders": 42,
  "totalRevenue": 28500.50,
  "averageOrderValue": 678.58,
  "topItems": [
    { "name": "Laptop", "count": 12, "revenue": 11999.88 },
    { "name": "Monitor", "count": 8, "revenue": 1999.92 }
  ],
  "revenueByDay": [
    { "date": "2024-10-28", "revenue": 5000 },
    { "date": "2024-10-29", "revenue": 8500 },
    { "date": "2024-10-30", "revenue": 15000.50 }
  ],
  "source": "mongodb",
  "timestamp": "2024-10-30T12:00:00.000Z"
}
\`\`\`

### Health Check
\`\`\`bash
GET /api/health

Response:
{
  "status": "healthy",
  "timestamp": "2024-10-30T12:00:00.000Z",
  "services": {
    "mongodb": { "status": "healthy" },
    "redis": { "status": "healthy" },
    "cassandra": { "status": "healthy" }
  }
}
\`\`\`

## Database Connections

### MongoDB
- **Host**: localhost:27017
- **Username**: admin
- **Password**: password
- **Database**: smart-orders
- **Connection String**: `mongodb://admin:password@localhost:27017/smart-orders?authSource=admin`

### Redis
- **Host**: localhost:6379
- **Connection String**: `redis://localhost:6379`

### Cassandra
- **Host**: localhost:9042
- **Keyspace**: smart_orders
- **Cluster**: SmartOrderCluster

### Kafka
- **Broker**: localhost:9092
- **Topic**: order-events
- **Consumer Group**: smart-order-group

## Monitoring & Debugging

### View Logs
\`\`\`bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f mongodb
docker-compose logs -f kafka
\`\`\`

### Check Service Health
\`\`\`bash
# View all services
docker-compose ps

# Check specific service
docker-compose ps app
\`\`\`

### Access Databases Directly

#### MongoDB
\`\`\`bash
docker exec -it smart-order-mongodb mongosh -u admin -p password
> use smart-orders
> db.orders.find()
\`\`\`

#### Redis
\`\`\`bash
docker exec -it smart-order-redis redis-cli
> LRANGE orders:recent 0 -1
\`\`\`

#### Cassandra
\`\`\`bash
docker exec -it smart-order-cassandra cqlsh
> USE smart_orders;
> SELECT * FROM order_analytics;
\`\`\`

#### Kafka
\`\`\`bash
# List topics
docker exec smart-order-kafka kafka-topics.sh --list --bootstrap-server localhost:9092

# Consume messages
docker exec smart-order-kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic order-events \
  --from-beginning
\`\`\`

## Stopping Services

\`\`\`bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
\`\`\`

## Troubleshooting

### Services not starting
- Ensure Docker has enough resources (4GB+ RAM)
- Check logs: `docker-compose logs`
- Wait longer for Cassandra to start (can take 60+ seconds)

### Connection refused errors
- Verify all services are healthy: `docker-compose ps`
- Check firewall settings
- Ensure ports 3000, 27017, 6379, 9042, 9092 are available

### Kafka consumer not processing events
- Check Kafka logs: `docker-compose logs kafka`
- Verify topic exists: `docker exec smart-order-kafka kafka-topics.sh --list --bootstrap-server localhost:9092`
- Check consumer group: `docker exec smart-order-kafka kafka-consumer-groups.sh --list --bootstrap-server localhost:9092`

## Performance Tips

1. **Redis Cache**: First request fetches from MongoDB, subsequent requests use Redis cache
2. **Cassandra Analytics**: Updated asynchronously via Kafka consumer
3. **Connection Pooling**: All database clients use connection pooling
4. **Health Checks**: Services have health checks to ensure availability

## Next Steps

- Modify order schema in MongoDB
- Add more Kafka topics for different event types
- Implement Cassandra aggregations for real-time analytics
- Add authentication and authorization
- Deploy to production with proper scaling
