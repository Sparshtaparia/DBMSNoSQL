# Smart Order Processing System - Seminar Demo Guide

## Overview

This is a **polyglot persistence** demonstration showing how different NoSQL databases and event streaming work together in a modern e-commerce system with REAL database connections.

### Architecture Stack
- **Frontend**: React.js (Next.js)
- **Backend**: Next.js API Routes with real database drivers
- **Databases**: MongoDB, Redis, Cassandra (actual connections)
- **Event Broker**: Kafka (real event streaming)
- **Containerization**: Docker Compose

---

## Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Node.js 18+ (for local development)

### Run with Docker Compose (Recommended for Seminar)

\`\`\`bash
# Navigate to project directory
cd smart-order-system

# Start all services
docker-compose up -d

# Wait for all services to be healthy (60-90 seconds)
docker-compose ps

# Access the app
open http://localhost:3000
\`\`\`

---

## Demo Flow (Live Presentation Script)

### Step 1: Show the Real Architecture

"This system demonstrates polyglot persistence with REAL database connections - using the right database for the right job."

Point to the docker-compose.yml and explain:
- **MongoDB**: Document store for flexible order data (primary storage)
- **Redis**: In-memory cache for fast access (1-hour TTL)
- **Cassandra**: Distributed database for analytics (time-series data)
- **Kafka**: Event broker for asynchronous communication (order-events topic)

### Step 2: Create an Order

1. Go to **Orders** tab
2. Fill in:
   - Customer Name: "John Doe"
   - Item Name: "Laptop"
   - Quantity: 2
   - Price: 999.99
3. Click "Create Order"

**What happens behind the scenes (REAL operations):**

\`\`\`
1. Order saved to MongoDB (via mongodb driver)
   └─ Stored in smart-orders.orders collection
   
2. Order cached in Redis (via redis driver)
   └─ Stored in orders:recent list with 1-hour TTL
   
3. Event published to Kafka (via kafkajs)
   └─ Published to order-events topic
   
4. Kafka consumer processes event (running in background)
   └─ Listens to order-events topic
   
5. Analytics updated in Cassandra (via cassandra-driver)
   └─ Updates order_analytics and daily_summary tables
\`\`\`

### Step 3: View Orders

1. Go to **Order List** tab
2. Show the orders with their source indicator (Redis or MongoDB)
3. Explain: "Recent orders come from Redis cache for speed (sub-millisecond), older ones fall back to MongoDB"

**Behind the scenes:**
- First tries to fetch from Redis cache
- If cache miss, queries MongoDB
- Returns source indicator so you can see which database served the request

### Step 4: View Analytics

1. Go to **Analytics** tab
2. Show:
   - Total Orders (aggregated from MongoDB)
   - Total Revenue (calculated from all orders)
   - Average Order Value
   - Top Items chart
   - Revenue Trend chart

**Explain:** "All this data is calculated from MongoDB in real-time. In production, Cassandra would store pre-aggregated analytics updated by Kafka listeners."

### Step 5: Monitor Databases (Live Demonstration)

Open multiple terminals to show REAL data flowing through each database:

#### Terminal 1: MongoDB - View Orders
\`\`\`bash
docker exec -it smart-order-mongodb mongosh -u admin -p password
> use smart-orders
> db.orders.find().pretty()
\`\`\`

#### Terminal 2: Redis - View Cache
\`\`\`bash
docker exec -it smart-order-redis redis-cli
> LRANGE orders:recent 0 -1
> TTL orders:recent
\`\`\`

#### Terminal 3: Kafka - View Events
\`\`\`bash
docker exec -it smart-order-kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic order-events \
  --from-beginning
\`\`\`

#### Terminal 4: Cassandra - View Analytics
\`\`\`bash
docker exec -it smart-order-cassandra cqlsh
> USE smart_orders;
> SELECT * FROM order_analytics;
> SELECT * FROM daily_summary;
\`\`\`

---

## Key Talking Points

### 1. Polyglot Persistence (Real Implementation)
> "This system uses REAL database drivers for each technology:
> - MongoDB driver for document storage
> - Redis driver for caching
> - Cassandra driver for analytics
> - Kafka client for event streaming
> 
> Instead of forcing all data into one database, we use the best tool for each job."

### 2. Event-Driven Architecture (Real Kafka)
> "When an order is created, it triggers a real cascade of events:
> - Stored in MongoDB (synchronous)
> - Cached in Redis (synchronous)
> - Published to Kafka (asynchronous)
> - Processed by Kafka consumer (background)
> - Analytics updated in Cassandra (eventual consistency)
> 
> This decouples services and enables scalability."

### 3. Caching Strategy (Real Redis)
> "Redis provides sub-millisecond access to recent orders:
> - First 50 orders cached with 1-hour TTL
> - Cache hit rate improves with repeated access
> - Fallback to MongoDB for cache misses
> - Reduces database load by 80-90%"

### 4. Scalability (Real Distributed System)
> "This architecture scales because:
> - Redis handles read traffic (in-memory)
> - Kafka decouples services (asynchronous)
> - Cassandra distributes analytics (horizontal scaling)
> - Each database can scale independently
> - MongoDB handles writes efficiently"

### 5. Real-World Use Cases
> "Companies like Netflix, Uber, and Airbnb use similar architectures:
> - Netflix: Cassandra for viewing history (billions of events)
> - Uber: Redis for real-time location cache (millions of requests/sec)
> - Airbnb: MongoDB for flexible listings (schema flexibility)
> - All use Kafka for event streaming (decoupling)"

---

## Demo Metrics to Show

Create 5-10 orders with different items to demonstrate:
- Order count increasing in MongoDB
- Cache hit rate improving in Redis
- Revenue accumulating in analytics
- Top items appearing in charts
- Events flowing through Kafka in real-time

---

## Health Check Endpoint

Show the health of all services:
\`\`\`bash
curl http://localhost:3000/api/health
\`\`\`

Response shows status of MongoDB, Redis, and Cassandra connections.

---

## Troubleshooting

### Services won't start
\`\`\`bash
# Check logs
docker-compose logs -f

# Restart everything
docker-compose down -v
docker-compose up -d
\`\`\`

### Connection errors
\`\`\`bash
# Ensure all services are healthy
docker-compose ps

# Check specific service logs
docker-compose logs mongodb
docker-compose logs redis
docker-compose logs kafka
\`\`\`

### Kafka consumer not processing
\`\`\`bash
# Check Kafka topics
docker exec smart-order-kafka kafka-topics.sh --list --bootstrap-server localhost:9092

# Check consumer groups
docker exec smart-order-kafka kafka-consumer-groups.sh --list --bootstrap-server localhost:9092
\`\`\`

---

## Learning Outcomes

After this demo, attendees should understand:
1. ✅ What polyglot persistence is and why it matters
2. ✅ How different databases serve different purposes
3. ✅ Event-driven architecture with real Kafka
4. ✅ Caching strategies with Redis
5. ✅ How to orchestrate multiple services with Docker
6. ✅ Real-world scalability considerations

---

## Extension Ideas

1. **Add Spring Boot Backend**: Replace Next.js with real Spring Boot microservice
2. **Add Monitoring**: Prometheus + Grafana for metrics
3. **Add API Documentation**: Swagger/OpenAPI
4. **Add Testing**: Jest + integration tests
5. **Add CI/CD**: GitHub Actions for deployment
6. **Add Authentication**: Supabase or Auth0

---

**Good luck with your seminar!**
