import { getRabbitMQChannel } from "./rabbitmq"
import { execute } from "./cassandra" // Removed getCassandraConnection as it's unused

let consumerRunning = false

export async function startRabbitMQConsumer() {
    if (consumerRunning) return

    try {
        const channel = await getRabbitMQChannel()
        const queue = process.env.RABBITMQ_QUEUE || "order-events"

        // Assert queue exists
        await channel.assertQueue(queue, { durable: true })

        // Set prefetch to 1 for fair dispatch
        await channel.prefetch(1)

        // Start consuming
        // Fix TS7006: Explicitly typing 'msg' as 'any' to resolve the implicit 'any' error
        // without requiring external library type definitions.
        await channel.consume(queue, async (msg: any) => {
            if (!msg) return

            try {
                const orderEvent = JSON.parse(msg.content.toString())
                console.log("[RabbitMQ Consumer] Processing order event:", orderEvent.orderId)

                // Define 'today' inside the consumer scope
                const today = new Date().toISOString().split("T")[0]

                // Update order analytics by item
                await execute(
                    `UPDATE smart_orders.order_analytics
                     SET order_count = order_count + 1, total_revenue = total_revenue + ?
                     WHERE date = ? AND item_name = ?`,
                    [orderEvent.total, today, orderEvent.itemName],
                    { prepare: true },
                )

                // Update daily summary
                await execute(
                    `UPDATE smart_orders.daily_summary
                     SET total_orders = total_orders + 1, total_revenue = total_revenue + ?
                     WHERE date = ?`,
                    [orderEvent.total, today],
                    { prepare: true },
                )

                console.log("[Cassandra] Analytics updated for order:", orderEvent.orderId)

                // Acknowledge message
                channel.ack(msg)
            } catch (error) {
                console.error("[RabbitMQ Consumer] Error processing message:", error)
                // Nack and requeue on error
                channel.nack(msg, false, true)
            }
        })

        consumerRunning = true
        console.log("[RabbitMQ Consumer] Started successfully")
    } catch (error) {
        console.error("[RabbitMQ Consumer] Failed to start:", error)
    }
}

/**
 * Although currently unused (TS6133), this function is kept for clean shutdown
 * purposes in a production environment.
 */
export async function stopRabbitMQConsumer() {
    if (!consumerRunning) return

    try {
        const channel = await getRabbitMQChannel()
        await channel.close()
        consumerRunning = false
        console.log("[RabbitMQ Consumer] Stopped")
    } catch (error) {
        console.error("[RabbitMQ Consumer] Error stopping:", error)
    }
}
