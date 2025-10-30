import { Kafka, type Producer, type Consumer } from "kafkajs"

let kafka: Kafka | null = null
let producer: Producer | null = null
let consumer: Consumer | null = null

export async function initializeKafka() {
  const brokers = (process.env.KAFKA_BROKERS || "localhost:9092").split(",")

  kafka = new Kafka({
    clientId: "smart-order-app",
    brokers,
    retry: {
      initialRetryTime: 100,
      retries: 8,
    },
  })

  return kafka
}

export async function getKafkaProducer(): Promise<Producer> {
  if (producer && producer.isIdempotent !== undefined) return producer

  if (!kafka) {
    await initializeKafka()
  }

  producer = kafka!.producer()
  await producer.connect()
  console.log("[Kafka] Producer connected")
  return producer
}

export async function getKafkaConsumer(): Promise<Consumer> {
  if (consumer) return consumer

  if (!kafka) {
    await initializeKafka()
  }

  consumer = kafka!.consumer({ groupId: "smart-order-group" })
  await consumer.connect()
  console.log("[Kafka] Consumer connected")
  return consumer
}

export async function publishOrderEvent(order: any) {
  try {
    const producer = await getKafkaProducer()
    await producer.send({
      topic: "order-events",
      messages: [
        {
          key: order.id,
          value: JSON.stringify({
            orderId: order.id,
            itemName: order.itemName,
            quantity: order.quantity,
            price: order.price,
            total: order.total,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    })
    console.log("[Kafka] Order event published:", order.id)
  } catch (error) {
    console.error("[Kafka] Failed to publish event:", error)
  }
}

export async function closeKafkaConnections() {
  if (producer) {
    await producer.disconnect()
    producer = null
  }
  if (consumer) {
    await consumer.disconnect()
    consumer = null
  }
}
