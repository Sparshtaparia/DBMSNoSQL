import { getCassandraConnection } from "./cassandra"
import { getKafkaConsumer } from "./kafka"

let consumerRunning = false

export async function startKafkaConsumer() {
  if (consumerRunning) return

  try {
    const consumer = await getKafkaConsumer()

    await consumer.subscribe({ topic: "order-events", fromBeginning: false })

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const orderEvent = JSON.parse(message.value?.toString() || "{}")
          console.log("[Kafka Consumer] Processing order event:", orderEvent.orderId)

          // Update Cassandra with analytics
          const cassandra = await getCassandraConnection()
          const today = new Date().toISOString().split("T")[0]

          // Update order analytics by item
          await cassandra.execute(
            `UPDATE smart_orders.order_analytics 
             SET order_count = order_count + 1, total_revenue = total_revenue + ?
             WHERE date = ? AND item_name = ?`,
            [orderEvent.total, today, orderEvent.itemName],
            { prepare: true },
          )

          // Update daily summary
          await cassandra.execute(
            `UPDATE smart_orders.daily_summary 
             SET total_orders = total_orders + 1, total_revenue = total_revenue + ?
             WHERE date = ?`,
            [orderEvent.total, today],
            { prepare: true },
          )

          console.log("[Cassandra] Analytics updated for order:", orderEvent.orderId)
        } catch (error) {
          console.error("[Kafka Consumer] Error processing message:", error)
        }
      },
    })

    consumerRunning = true
    console.log("[Kafka Consumer] Started successfully")
  } catch (error) {
    console.error("[Kafka Consumer] Failed to start:", error)
  }
}

export async function stopKafkaConsumer() {
  if (!consumerRunning) return

  try {
    const consumer = await getKafkaConsumer()
    await consumer.disconnect()
    consumerRunning = false
    console.log("[Kafka Consumer] Stopped")
  } catch (error) {
    console.error("[Kafka Consumer] Error stopping:", error)
  }
}
