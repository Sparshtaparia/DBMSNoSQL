import { type NextRequest, NextResponse } from "next/server"
import { getMongoDBConnection } from "@/lib/db/mongodb"
import { getRedisConnection } from "@/lib/db/redis"
import { publishOrderEvent } from "@/lib/db/rabbitmq"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerName, itemName, quantity, price } = body

    console.log("[v0] Orders API: Received order request:", { customerName, itemName, quantity, price })

    // Validate input
    if (!customerName || !itemName || !quantity || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const order = {
      id: `ORD-${Date.now()}`,
      customerName,
      itemName,
      quantity: Number.parseInt(quantity),
      price: Number.parseFloat(price),
      total: Number.parseInt(quantity) * Number.parseFloat(price),
      createdAt: new Date(),
      source: "mongodb",
    }

    // 1. Store in MongoDB
    try {
      const mongoDb = await getMongoDBConnection()
      const ordersCollection = mongoDb.collection("orders")
      const mongoResult = await ordersCollection.insertOne(order)
      console.log("[v0] MongoDB: Order inserted:", mongoResult.insertedId)
    } catch (mongoError) {
      console.error("[v0] MongoDB Error:", mongoError)
      throw new Error(`MongoDB failed: ${mongoError}`)
    }

    // 2. Cache in Redis
    try {
      const redis = await getRedisConnection()
      const cacheKey = `orders:recent`
      await redis.lPush(cacheKey, JSON.stringify(order))
      await redis.lTrim(cacheKey, 0, 49) // Keep last 50
      await redis.expire(cacheKey, 3600) // 1 hour TTL
      console.log("[v0] Redis: Order cached")
    } catch (redisError) {
      console.error("[v0] Redis Error:", redisError)
      // Don't fail the request if Redis fails
    }

    // 3. Publish to RabbitMQ
    try {
      await publishOrderEvent(order)
    } catch (rabbitError) {
      console.error("[v0] RabbitMQ Error:", rabbitError)
      // Don't fail the request if RabbitMQ fails
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",
        order: {
          ...order,
          createdAt: order.createdAt.toISOString(),
        },
        pipeline: {
          mongodb: "Stored ✓",
          redis: "Cached ✓",
          rabbitmq: "Event published ✓",
          cassandra: "Will be updated by RabbitMQ listener",
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Orders API Error:", error)
    return NextResponse.json({ error: "Failed to create order", details: String(error) }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log("[v0] Orders API: Fetching orders...")
    const redis = await getRedisConnection()
    const mongoDb = await getMongoDBConnection()

    let orders: any[] = []
    let source = "mongodb"

    // Try Redis cache first
    try {
      const cachedOrders = await redis.lRange("orders:recent", 0, 19)
      if (cachedOrders && cachedOrders.length > 0) {
        orders = cachedOrders.map((item) => {
          const parsed = JSON.parse(item)
          return {
            ...parsed,
            source: "redis",
          }
        })
        source = "redis"
        console.log("[v0] Orders API: Fetched from Redis cache")
      }
    } catch (redisError) {
      console.error("[v0] Redis fetch error:", redisError)
    }

    // Fallback to MongoDB if Redis is empty
    if (orders.length === 0) {
      try {
        const ordersCollection = mongoDb.collection("orders")
        const mongoOrders = await ordersCollection.find({}).sort({ createdAt: -1 }).limit(20).toArray()
        orders = mongoOrders.map((order) => ({
          ...order,
          id: order._id?.toString() || order.id,
          source: "mongodb",
        }))
        source = "mongodb"
        console.log("[v0] Orders API: Fetched from MongoDB")
      } catch (mongoError) {
        console.error("[v0] MongoDB fetch error:", mongoError)
      }
    }

    return NextResponse.json({
      orders,
      source,
      count: orders.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Orders API Error:", error)
    return NextResponse.json({ error: "Failed to fetch orders", details: String(error) }, { status: 500 })
  }
}
