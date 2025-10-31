import { getRabbitMQChannel } from "./rabbitmq"

// DO NOT import execute here, as it causes the circular dependency issue.
// We will import it lazily inside the consumer function.

let consumerRunning = false

// Define a placeholder for the execute function from cassandra.ts
type CassandraExecute = (query: string, params?: any[], options?: { prepare: boolean }) => Promise<any>;

// Store the lazy-loaded module reference
let cassandraModule: { execute: CassandraExecute } | null = null;

async function getExecuteFunction(): Promise<CassandraExecute> {
    if (!cassandraModule) {
        // Dynamically import the module, breaking the synchronous cycle
        cassandraModule = await import("./cassandra") as { execute: CassandraExecute };
    }
    return cassandraModule.execute;
}

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
        await channel.consume(queue, async (msg: any) => {
            if (!msg) return

            // CRITICAL: Get the execute function lazily inside the handler
            const execute = await getExecuteFunction();

            try {
                const orderEvent = JSON.parse(msg.content.toString())
                console.log("[RabbitMQ Consumer] Processing order event:", orderEvent.orderId)

                // Update Cassandra with analytics
                const today = new Date().toISOString().split("T")[0]

                // Update order analytics by item
                await execute( // <-- Now uses the lazily loaded execute function
                    `UPDATE smart_orders.order_analytics
                     SET order_count = order_count + 1, total_revenue = total_revenue + ?
                     WHERE date = ? AND item_name = ?`,
                    [orderEvent.total, today, orderEvent.itemName],
                    { prepare: true },
                )

                // Update daily summary
                await execute( // <-- Now uses the lazily loaded execute function
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
