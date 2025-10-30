import { connectMongoDB, closeMongoDBConnection } from "@/lib/db/mongodb"
import { connectRedis, closeRedisConnection } from "@/lib/db/redis"
import { connectCassandra, closeCassandraConnection } from "@/lib/db/cassandra"
import { initializeKafka } from "@/lib/db/kafka"

async function initializeDatabases() {
  console.log("Initializing all databases...")

  try {
    // Initialize MongoDB
    console.log("Connecting to MongoDB...")
    const mongoDb = await connectMongoDB()
    console.log("MongoDB initialized")

    // Initialize Redis
    console.log("Connecting to Redis...")
    const redis = await connectRedis()
    console.log("Redis initialized")

    // Initialize Cassandra
    console.log("Connecting to Cassandra...")
    const cassandra = await connectCassandra()
    console.log("Cassandra initialized")

    // Initialize Kafka
    console.log("Initializing Kafka...")
    await initializeKafka()
    console.log("Kafka initialized")

    console.log("\nAll databases initialized successfully!")
    console.log("MongoDB: Connected")
    console.log("Redis: Connected")
    console.log("Cassandra: Connected")
    console.log("Kafka: Ready")

    // Cleanup
    await closeMongoDBConnection()
    await closeRedisConnection()
    await closeCassandraConnection()
  } catch (error) {
    console.error("Failed to initialize databases:", error)
    process.exit(1)
  }
}

initializeDatabases()
