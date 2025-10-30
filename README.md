# Smart Order Processing System

A production-ready polyglot persistence demonstration using MongoDB, Redis, Cassandra, Kafka, and Next.js with REAL database connections.

## Quick Start

\`\`\`bash
docker-compose up -d
open http://localhost:3000
\`\`\`

## Architecture

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                   React Frontend                         │
│              (Order Form, List, Analytics)               │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/JSON
┌────────────────────▼────────────────────────────────────┐
│              Next.js API Routes                          │
│         (Real Database Drivers & Connections)            │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬──────────────┐
        │            │            │              │
    ┌───▼──┐    ┌───▼──┐    ┌───▼──┐      ┌───▼──┐
    │Mongo │    │Redis │    │Kafka │      │Cassa-│
    │  DB  │    │Cache │    │Broker│      │ndra  │
    └──────┘    └──────┘    └──────┘      └──────┘
\`\`\`

## Features

- ✅ Create orders (stored in MongoDB with real driver)
- ✅ View cached orders (from Redis with real driver)
- ✅ Real-time analytics (aggregated from MongoDB)
- ✅ Event streaming (via Kafka with real kafkajs)
- ✅ Kafka consumer (processes events asynchronously)
- ✅ Docker containerization with health checks
- ✅ Production-ready setup

## Services

| Service | Port | Purpose | Driver |
|---------|------|---------|--------|
| Next.js App | 3000 | Frontend + API | - |
| MongoDB | 27017 | Order storage | mongodb |
| Redis | 6379 | Cache layer | redis |
| Cassandra | 9042 | Analytics | cassandra-driver |
| Kafka | 9092 | Event broker | kafkajs |
| Zookeeper | 2181 | Kafka coordinator | - |

## API Endpoints

### Create Order
\`\`\`bash
POST /api/orders
{
  "customerName": "John Doe",
  "itemName": "Laptop",
  "quantity": 1,
  "price": 999.99
}
\`\`\`

### Get Orders
\`\`\`bash
GET /api/orders
\`\`\`

Returns orders from Redis cache (or MongoDB fallback) with source indicator.

### Get Analytics
\`\`\`bash
GET /api/analytics
\`\`\`

Returns aggregated analytics: total orders, revenue, top items, trends.

### Health Check
\`\`\`bash
GET /api/health
\`\`\`

Returns status of all database connections.

## Database Connections

### MongoDB
- **Host**: localhost:27017
- **Username**: admin
- **Password**: password
- **Database**: smart-orders
- **Driver**: mongodb 6.20.0

### Redis
- **Host**: localhost:6379
- **Driver**: redis 5.9.0

### Cassandra
- **Host**: localhost:9042
- **Keyspace**: smart_orders
- **Driver**: cassandra-driver 4.8.0

### Kafka
- **Broker**: localhost:9092
- **Topic**: order-events
- **Consumer Group**: smart-order-group
- **Driver**: kafkajs 2.2.4

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## Production

\`\`\`bash
docker-compose up -d
\`\`\`

## Monitoring

\`\`\`bash
# View all services
docker-compose ps

# View logs
docker-compose logs -f

# Access MongoDB
docker exec -it smart-order-mongodb mongosh -u admin -p password

# Access Redis
docker exec -it smart-order-redis redis-cli

# Access Cassandra
docker exec -it smart-order-cassandra cqlsh

# View Kafka events
docker exec -it smart-order-kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic order-events \
  --from-beginning
\`\`\`

## Project Structure

\`\`\`
├── app/
│   ├── api/
│   │   ├── orders/route.ts          # Order CRUD with real DB operations
│   │   ├── analytics/route.ts       # Analytics aggregation
│   │   ├── health/route.ts          # Health check endpoint
│   │   └── init/route.ts            # Kafka consumer initialization
│   ├── page.tsx                     # Main dashboard
│   └── layout.tsx                   # Root layout with Kafka consumer
├── lib/
│   └── db/
│       ├── mongodb.ts               # MongoDB connection & utilities
│       ├── redis.ts                 # Redis connection & utilities
│       ├── cassandra.ts             # Cassandra connection & utilities
│       ├── kafka.ts                 # Kafka producer & consumer setup
│       └── kafka-consumer.ts        # Kafka consumer implementation
├── components/
│   ├── order-form.tsx               # Create order form
│   ├── order-list.tsx               # Display orders
│   └── analytics.tsx                # Analytics dashboard
├── docker-compose.yml               # Multi-service orchestration
├── Dockerfile                       # Production build
└── SETUP_GUIDE.md                   # Detailed setup instructions
\`\`\`

## Key Technologies

- **Next.js 16** - Full-stack React framework
- **MongoDB 7.0** - Document database
- **Redis 7** - In-memory cache
- **Cassandra 4.1** - Distributed analytics database
- **Kafka 7.5** - Event streaming platform
- **Docker** - Containerization

## Real Database Drivers

This project uses actual database drivers for production-grade connections:

- `mongodb` - Official MongoDB Node.js driver
- `redis` - Official Redis Node.js client
- `cassandra-driver` - DataStax Cassandra driver
- `kafkajs` - Apache Kafka client for Node.js

## Troubleshooting

### Services won't start
\`\`\`bash
docker-compose down -v
docker-compose up -d
\`\`\`

### Connection refused
\`\`\`bash
# Wait for services to be healthy
docker-compose ps

# Check logs
docker-compose logs
\`\`\`

### Kafka consumer not processing
\`\`\`bash
# Verify topic exists
docker exec smart-order-kafka kafka-topics.sh --list --bootstrap-server localhost:9092

# Check consumer group
docker exec smart-order-kafka kafka-consumer-groups.sh --list --bootstrap-server localhost:9092
\`\`\`

## License

MIT
