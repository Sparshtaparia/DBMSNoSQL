import { MongoClient, type Db } from "mongodb"

let mongoClient: MongoClient | null = null
let db: Db | null = null

export async function connectMongoDB(): Promise<Db> {
  if (db) return db

  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.error("[v0] MongoDB: MONGODB_URI environment variable is not set!")
    throw new Error("MONGODB_URI environment variable is required")
  }

  try {
    console.log("[v0] MongoDB: Attempting connection to Atlas cluster...")
    console.log("[v0] MongoDB: URI starts with:", uri.substring(0, 30) + "...")

    mongoClient = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
    })

    await mongoClient.connect()
    console.log("[v0] MongoDB: Connected to server")

    db = mongoClient.db("smart-orders")

    // Test connection
    await db.admin().ping()
    console.log("[v0] MongoDB: Ping successful")

    // Create collections if they don't exist
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((c) => c.name)

    if (!collectionNames.includes("orders")) {
      await db.createCollection("orders")
      await db.collection("orders").createIndex({ createdAt: -1 })
      await db.collection("orders").createIndex({ customerId: 1 })
      console.log("[v0] MongoDB: Created 'orders' collection with indexes")
    }

    if (!collectionNames.includes("customers")) {
      await db.createCollection("customers")
      console.log("[v0] MongoDB: Created 'customers' collection")
    }

    console.log("[v0] MongoDB: Connected successfully to Atlas")
    return db
  } catch (error) {
    console.error("[v0] MongoDB Connection error:", error)
    throw error
  }
}

export async function getMongoDBConnection(): Promise<Db> {
  if (!db) {
    return connectMongoDB()
  }
  return db
}

export async function closeMongoDBConnection() {
  if (mongoClient) {
    await mongoClient.close()
    mongoClient = null
    db = null
  }
}
