import { NextResponse } from "next/server"
import { startRabbitMQConsumer } from "@/lib/db/rabbitmq-consumer"
import { connectMongoDB } from "@/lib/db/mongodb"
import { connectRedis } from "@/lib/db/redis"

export async function POST() {
  try {
    console.log("[v0] Init: Starting database initialization...")

    console.log("[v0] Init: Connecting to MongoDB...")
    await connectMongoDB()

    console.log("[v0] Init: Connecting to Redis...")
    await connectRedis()

    console.log("[v0] Init: Starting RabbitMQ consumer...")
    await startRabbitMQConsumer()

    console.log("[v0] Init: All databases initialized successfully")

    return NextResponse.json({
      success: true,
      message: "All databases initialized successfully",
    })
  } catch (error) {
    console.error("[v0] Init error:", error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}
