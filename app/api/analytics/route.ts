import { NextResponse } from "next/server"
import { getMongoDBConnection } from "@/lib/db/mongodb"

export async function GET() {
  try {
    console.log("[v0] Analytics API: Fetching analytics...")
    const mongoDb = await getMongoDBConnection()
    const ordersCollection = mongoDb.collection("orders")

    // Get all orders
    const allOrders = await ordersCollection.find({}).toArray()
    console.log("[v0] Analytics: Found", allOrders.length, "orders")

    // Calculate analytics
    const totalOrders = allOrders.length
    const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Group by item
    const itemMap = new Map<string, { count: number; revenue: number }>()
    allOrders.forEach((order) => {
      const item = order.itemName
      const current = itemMap.get(item) || { count: 0, revenue: 0 }
      itemMap.set(item, {
        count: current.count + 1,
        revenue: current.revenue + (order.total || 0),
      })
    })

    const topItems = Array.from(itemMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Group by date
    const dateMap = new Map<string, number>()
    allOrders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split("T")[0]
      const current = dateMap.get(date) || 0
      dateMap.set(date, current + (order.total || 0))
    })

    const revenueByDay = Array.from(dateMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7)

    console.log("[v0] Analytics: Calculated metrics - Orders:", totalOrders, "Revenue:", totalRevenue)

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      averageOrderValue,
      topItems,
      revenueByDay,
      source: "mongodb",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Analytics API Error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics", details: String(error) }, { status: 500 })
  }
}
