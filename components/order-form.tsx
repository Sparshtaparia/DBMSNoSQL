"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface OrderFormProps {
  onOrderCreated: () => void
}

export default function OrderForm({ onOrderCreated }: OrderFormProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    customerName: "",
    itemName: "",
    quantity: "",
    price: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      console.log("[v0] OrderForm: Submitting order:", formData)
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.customerName,
          itemName: formData.itemName,
          quantity: Number.parseInt(formData.quantity),
          price: Number.parseFloat(formData.price),
        }),
      })

      const responseData = await response.json()
      console.log("[v0] OrderForm: Response:", responseData)

      if (!response.ok) {
        throw new Error(responseData.details || responseData.error || "Failed to create order")
      }

      setSuccess(true)
      setFormData({ customerName: "", itemName: "", quantity: "", price: "" })
      onOrderCreated()

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred"
      console.error("[v0] OrderForm Error:", errorMsg)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Create New Order</CardTitle>
        <CardDescription className="text-slate-400">
          Order data flows through MongoDB → Redis → RabbitMQ → Cassandra
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Customer Name</label>
              <Input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Item Name</label>
              <Input
                type="text"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                placeholder="Laptop"
                required
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
              <Input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="1"
                required
                min="1"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Price ($)</label>
              <Input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="999.99"
                required
                step="0.01"
                min="0"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
              />
            </div>
          </div>

          {success && (
            <div className="p-3 bg-green-900 border border-green-700 rounded text-green-200 text-sm">
              ✓ Order created successfully! Data stored in MongoDB, cached in Redis, event published to RabbitMQ.
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-900 border border-red-700 rounded text-red-200 text-sm">
              <p>✗ {error}</p>
              <p className="text-xs mt-1">Check browser console for details</p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? "Creating Order..." : "Create Order"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
