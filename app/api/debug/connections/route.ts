import { NextResponse } from "next/server"
import { connectMongoDB } from "@/lib/db/mongodb"
import { connectRedis } from "@/lib/db/redis"
import { connectCassandra } from "@/lib/db/cassandra"
import { connectRabbitMQ } from "@/lib/db/rabbitmq"

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    connections: {},
  }

  // Test MongoDB
  try {
    console.log("[v0] Debug: Testing MongoDB connection...")
    await connectMongoDB()
    results.connections.mongodb = { status: "✓ Connected", message: "MongoDB Atlas is reachable" }
  } catch (error: any) {
    results.connections.mongodb = { status: "✗ Failed", error: error.message }
    console.error("[v0] Debug: MongoDB failed:", error.message)
  }

  // Test Redis
  try {
    console.log("[v0] Debug: Testing Redis connection...")
    await connectRedis()
    results.connections.redis = { status: "✓ Connected", message: "Redis Upstash is reachable" }
  } catch (error: any) {
    results.connections.redis = { status: "✗ Failed", error: error.message }
    console.error("[v0] Debug: Redis failed:", error.message)
  }

  // Test Cassandra
  try {
    console.log("[v0] Debug: Testing Cassandra connection...")
    await connectCassandra()
    results.connections.cassandra = { status: "✓ Connected", message: "Cassandra Astra is reachable" }
  } catch (error: any) {
    results.connections.cassandra = { status: "✗ Failed", error: error.message }
    console.error("[v0] Debug: Cassandra failed:", error.message)
  }

  // Test RabbitMQ
  try {
    console.log("[v0] Debug: Testing RabbitMQ connection...")
    await connectRabbitMQ()
    results.connections.rabbitmq = { status: "✓ Connected", message: "RabbitMQ CloudAMQP is reachable" }
  } catch (error: any) {
    results.connections.rabbitmq = { status: "✗ Failed", error: error.message }
    console.error("[v0] Debug: RabbitMQ failed:", error.message)
  }

  return NextResponse.json(results)
}
