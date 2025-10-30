import { createClient, type RedisClientType } from "redis"

let redisClient: RedisClientType | null = null

export async function connectRedis(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) return redisClient

  const url = process.env.REDIS_URI

  if (!url) {
    console.error("[v0] Redis: REDIS_URI environment variable is not set!")
    throw new Error("REDIS_URI environment variable is required")
  }

  try {
    console.log("[v0] Redis: Attempting connection to Upstash...")
    console.log("[v0] Redis: URL starts with:", url.substring(0, 20) + "...")

    redisClient = createClient({ url })
    redisClient.on("error", (err) => console.error("[v0] Redis Error:", err))

    await redisClient.connect()

    const pong = await redisClient.ping()
    console.log("[v0] Redis: Ping response:", pong)
    console.log("[v0] Redis: Connected successfully to Upstash")
    return redisClient
  } catch (error) {
    console.error("[v0] Redis Connection error:", error)
    throw error
  }
}

export async function getRedisConnection(): Promise<RedisClientType> {
  if (!redisClient || !redisClient.isOpen) {
    return connectRedis()
  }
  return redisClient
}

export async function closeRedisConnection() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit()
    redisClient = null
  }
}
