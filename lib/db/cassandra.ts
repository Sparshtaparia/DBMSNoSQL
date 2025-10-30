import { DataAPIClient, Db } from "@datastax/astra-db-ts"

// Type for the Data API client's database object
let astraDb: Db | null = null

// Hardcoded for demonstration, but environment variables are preferred
const ASTRA_DB_APPLICATION_TOKEN = process.env.CASSANDRA_TOKEN
const ASTRA_DB_ENDPOINT = process.env.CASSANDRA_ENDPOINT

export async function connectCassandra(): Promise<Db> {
    if (astraDb) return astraDb

    if (!ASTRA_DB_APPLICATION_TOKEN || !ASTRA_DB_ENDPOINT) {
        console.error("[AstraDB] Connection: ASTRA_DB_APPLICATION_TOKEN or ASTRA_DB_ENDPOINT is not set!")
        throw new Error("AstraDB credentials are required")
    }

    try {
        console.log("[AstraDB] Attempting connection...")

        // Initialize the client
        const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)

        // Connect to the specific database
        astraDb = client.db(ASTRA_DB_ENDPOINT)

        // Test connection by listing collections/tables
        const collections = await astraDb.listCollections()
        console.log("[AstraDB] Connected successfully. Collections/Tables found:", collections)

        return astraDb
    } catch (error) {
        console.error("[AstraDB] Connection error:", error)
        throw error
    }
}

export async function getCassandraConnection(): Promise<Db> {
    if (!astraDb) {
        return connectCassandra()
    }
    return astraDb
}

/**
 * Executes a Data API operation based on the consumer's original CQL intent.
 * This function uses the Read-Modify-Write pattern (findOne + updateOne)
 * necessary for atomic updates on AstraDB Tables, splitting logic between
 * the 'item_analytics' and 'analytics' tables.
 */
export async function executeCassandraQuery(query: string, params?: any[], options?: { prepare: boolean }) {
    const db = await getCassandraConnection()

    // Destructure parameters: [orderEvent.total, today, orderEvent.itemName]
    const [totalRevenue, date, itemName] = params || []

    if (query.includes("order_analytics")) {
        // --- Order Analytics by Item (Targets 'item_analytics' table) ---
        const collection = db.collection('item_analytics')

        console.log(`[AstraDB] R-M-W update for item: ${itemName} on date: ${date} (using 'item_analytics')`)

        // Filter based on the compound primary key (date, item_name)
        const filter = { date: date, item_name: itemName }

        // 1. READ: Find the current document
        const currentDoc = await collection.findOne(filter)

        // Calculate new values (default to 0 if null or undefined)
        const newOrderCount = (currentDoc?.document?.order_count || 0) + 1
        const newTotalRevenue = (currentDoc?.document?.total_revenue || 0) + totalRevenue

        // 2. MODIFY & 3. WRITE: Update the document with new calculated values
        await collection.updateOne(filter, {
            $set: {
                order_count: newOrderCount,
                total_revenue: newTotalRevenue
            }
        }, { upsert: true })

        return { success: true, message: "analytics_item_updated" }

    } else if (query.includes("daily_summary")) {
        // --- Daily Summary (Targets 'analytics' table) ---
        const collection = db.collection('analytics')
        console.log(`[AstraDB] R-M-W update for daily summary on date: ${date} (using 'analytics')`)

        // Filter: Using only the primary key 'date' as 'type' is not defined in the table schema.
        // This assumes 'date' is the sole partition key for the daily summary.
        const filter = { date: date } // <-- CORRECTED: Removed 'type' from filter

        // 1. READ: Find the current document
        const currentDoc = await collection.findOne(filter)

        // Calculate new values
        const newTotalOrders = (currentDoc?.document?.total_orders || 0) + 1
        const newTotalRevenue = (currentDoc?.document?.total_revenue || 0) + totalRevenue

        // 2. MODIFY & 3. WRITE: Update the document with new calculated values
        await collection.updateOne(filter, {
            $set: {
                total_orders: newTotalOrders,
                total_revenue: newTotalRevenue
            }
        }, { upsert: true })


        return { success: true, message: "analytics_daily_updated" }

    } else {
        console.warn(`[AstraDB] Unsupported query received: ${query}`)
        return { success: false, message: "Unsupported query type" }
    }
}

// Rename for clarity in the consumer
export const execute = executeCassandraQuery

export async function closeCassandraConnection() {
    // DataAPIClient doesn't typically require an explicit close
    astraDb = null
    console.log("[AstraDB] Connection configuration cleared.")
}
