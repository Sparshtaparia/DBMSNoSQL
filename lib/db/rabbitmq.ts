import amqp, { type Connection, type Channel } from "amqplib"

let connection: Connection | null = null
let channel: Channel | null = null

export async function connectRabbitMQ(): Promise<Channel> {
  if (channel && !channel.closed) return channel

  const url = process.env.RABBITMQ_URL

  if (!url) {
    console.error("[v0] RabbitMQ: RABBITMQ_URL environment variable is not set!")
    throw new Error("RABBITMQ_URL environment variable is required")
  }

  try {
    console.log("[v0] RabbitMQ: Attempting connection to CloudAMQP...")
    console.log("[v0] RabbitMQ: URL starts with:", url.substring(0, 20) + "...")

    connection = await amqp.connect(url)
    channel = await connection.createChannel()

    // Set up error handlers
    connection.on("error", (err) => console.error("[v0] RabbitMQ Connection error:", err))
    channel.on("error", (err) => console.error("[v0] RabbitMQ Channel error:", err))

    console.log("[v0] RabbitMQ: Channel created successfully")
    console.log("[v0] RabbitMQ: Connected successfully to CloudAMQP")
    return channel
  } catch (error) {
    console.error("[v0] RabbitMQ Connection error:", error)
    throw error
  }
}

export async function getRabbitMQChannel(): Promise<Channel> {
  if (!channel || channel.closed) {
    return connectRabbitMQ()
  }
  return channel
}

export async function publishOrderEvent(order: any) {
  try {
    const ch = await getRabbitMQChannel()
    const exchange = process.env.RABBITMQ_EXCHANGE || "orders"
    const queue = process.env.RABBITMQ_QUEUE || "order-events"

    // Declare exchange and queue
    await ch.assertExchange(exchange, "direct", { durable: true })
    await ch.assertQueue(queue, { durable: true })
    await ch.bindQueue(queue, exchange, "order")

    // Publish message
    const message = {
      orderId: order.id,
      itemName: order.itemName,
      quantity: order.quantity,
      price: order.price,
      total: order.total,
      timestamp: new Date().toISOString(),
    }

    ch.publish(exchange, "order", Buffer.from(JSON.stringify(message)))
    console.log("[v0] RabbitMQ: Order event published:", order.id)
  } catch (error) {
    console.error("[v0] RabbitMQ: Failed to publish event:", error)
  }
}

export async function closeRabbitMQConnection() {
  if (channel && !channel.closed) {
    await channel.close()
    channel = null
  }
  if (connection && !connection.closed) {
    await connection.close()
    connection = null
  }
}
