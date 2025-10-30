"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import OrderForm from "@/components/order-form"
import OrderList from "@/components/order-list"
import Analytics from "@/components/analytics"
import ConnectionStatus from "@/components/connection-status"

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleOrderCreated = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Smart Order Processing System</h1>
          <p className="text-slate-300 text-sm md:text-base">
            Polyglot Persistence Demo: MongoDB + Redis + Cassandra + RabbitMQ
          </p>
        </div>

        <div className="mb-8">
          <ConnectionStatus />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-700">
            <TabsTrigger value="orders" className="text-white text-xs md:text-sm">
              Orders
            </TabsTrigger>
            <TabsTrigger value="list" className="text-white text-xs md:text-sm">
              Order List
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white text-xs md:text-sm">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <OrderForm onOrderCreated={handleOrderCreated} />
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <OrderList refreshTrigger={refreshTrigger} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Analytics refreshTrigger={refreshTrigger} />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-700 text-center text-slate-400 text-xs md:text-sm">
          <p>Backend Stack: MongoDB (Orders) | Redis (Cache) | Cassandra (Analytics) | RabbitMQ (Events)</p>
        </div>
      </div>
    </main>
  )
}
