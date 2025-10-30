"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Order {
  id: string
  customerName: string
  itemName: string
  quantity: number
  price: number
  total: number
  createdAt: string
  source: string
}

interface OrderListProps {
  refreshTrigger: number
}

export default function OrderList({ refreshTrigger }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      setError("")
      try {
        console.log("[v0] OrderList: Fetching orders...")
        const response = await fetch("/api/orders")
        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status}`)
        }
        const data = await response.json()
        console.log("[v0] OrderList: Received data:", data)

        const ordersList = data.orders || data || []
        setOrders(Array.isArray(ordersList) ? ordersList : [])
        console.log("[v0] OrderList: Set orders:", ordersList.length)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "An error occurred"
        console.error("[v0] OrderList Error:", errorMsg)
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [refreshTrigger])

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Recent Orders</CardTitle>
        <CardDescription className="text-slate-400">Fetched from Redis cache (with MongoDB fallback)</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-slate-400 text-center py-8">Loading orders...</div>
        ) : error ? (
          <div className="text-red-400 text-center py-8">
            <p>{error}</p>
            <p className="text-xs mt-2">Check browser console for details</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-slate-400 text-center py-8">No orders yet. Create one to get started!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Customer</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Item</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-semibold">Qty</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Price</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">Total</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="py-3 px-4 text-slate-200">{order.customerName}</td>
                    <td className="py-3 px-4 text-slate-200">{order.itemName}</td>
                    <td className="py-3 px-4 text-center text-slate-200">{order.quantity}</td>
                    <td className="py-3 px-4 text-right text-slate-200">${order.price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-green-400 font-semibold">${order.total.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          order.source === "redis" ? "bg-red-900 text-red-200" : "bg-green-900 text-green-200"
                        }`}
                      >
                        {order.source === "redis" ? "⚡ Redis" : "📦 MongoDB"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
