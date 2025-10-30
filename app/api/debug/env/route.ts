import { NextResponse } from "next/server"

export async function GET() {
  const envVars = {
    MONGODB_URI: process.env.MONGODB_URI ? "✓ Set" : "✗ Missing",
    REDIS_URI: process.env.REDIS_URI ? "✓ Set" : "✗ Missing",
    CASSANDRA_ENDPOINT: process.env.CASSANDRA_ENDPOINT ? "✓ Set" : "✗ Missing",
    CASSANDRA_KEYSPACE: process.env.CASSANDRA_KEYSPACE ? "✓ Set" : "✗ Missing",
    CASSANDRA_TOKEN: process.env.CASSANDRA_TOKEN ? "✓ Set" : "✗ Missing",
    RABBITMQ_URL: process.env.RABBITMQ_URL ? "✓ Set" : "✗ Missing",
    RABBITMQ_QUEUE: process.env.RABBITMQ_QUEUE ? "✓ Set" : "✗ Missing",
    RABBITMQ_EXCHANGE: process.env.RABBITMQ_EXCHANGE ? "✓ Set" : "✗ Missing",
  }

  // Log to server console
  console.log("[v0] Environment Variables Status:")
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`[v0]   ${key}: ${value}`)
  })

  return NextResponse.json({
    message: "Check server console for environment variable status",
    envVars,
    timestamp: new Date().toISOString(),
  })
}
