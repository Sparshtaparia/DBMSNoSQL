import { NextResponse } from "next/server"
import { getMongoDBConnection } from "@/lib/db/mongodb"
import { getRedisConnection } from "@/lib/db/redis"
import { getCassandraConnection } from "@/lib/db/cassandra"
import { getRabbitMQChannel } from "@/lib/db/rabbitmq"

export async function GET() {
  const health: any = {
    status: "checking",
    timestamp: new Date().toISOString(),
    services: {},
  }

  // Check MongoDB
  try {
    console.log("[v0] Health: Checking MongoDB...")
    const mongoDb = await getMongoDBConnection()
    await mongoDb.admin().ping()
    health.services.mongodb = { status: "healthy", message: "Connected to Atlas cluster" }
    console.log("[v0] Health: MongoDB is healthy")
  } catch (error) {
    health.services.mongodb = { status: "unhealthy", error: String(error) }
    console.error("[v0] Health: MongoDB check failed:", error)
  }

  // Check Redis
  try {
    console.log("[v0] Health: Checking Redis...")
    const redis = await getRedisConnection()
    const pong = await redis.ping()
    health.services.redis = { status: "healthy", message: `Connected to Upstash (${pong})` }
    console.log("[v0] Health: Redis is healthy")
  } catch (error) {
    health.services.redis = { status: "unhealthy", error: String(error) }
    console.error("[v0] Health: Redis check failed:", error)
  }

  // Check Cassandra
  try {
    console.log("[v0] Health: Checking Cassandra...")
    const cassandra = await getCassandraConnection()
    health.services.cassandra = { status: "healthy", message: "Connected to Astra DataStax REST API" }
    console.log("[v0] Health: Cassandra is healthy")
  } catch (error) {
    health.services.cassandra = { status: "unhealthy", error: String(error) }
    console.error("[v0] Health: Cassandra check failed:", error)
  }

  // Check RabbitMQ
  try {
    console.log("[v0] Health: Checking RabbitMQ...")
    const channel = await getRabbitMQChannel()
    if (channel && !channel.closed) {
      health.services.rabbitmq = { status: "healthy", message: "Connected to CloudAMQP" }
      console.log("[v0] Health: RabbitMQ is healthy")
    } else {
      health.services.rabbitmq = { status: "unhealthy", error: "Channel closed" }
    }
  } catch (error) {
    health.services.rabbitmq = { status: "unhealthy", error: String(error) }
    console.error("[v0] Health: RabbitMQ check failed:", error)
  }

  const allHealthy = Object.values(health.services).every((s: any) => s.status === "healthy")
  health.status = allHealthy ? "healthy" : "degraded"

  return NextResponse.json(health, { status: allHealthy ? 200 : 503 })
}
