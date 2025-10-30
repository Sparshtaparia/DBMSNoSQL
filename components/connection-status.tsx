"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ServiceStatus {
  status: "healthy" | "unhealthy" | "checking"
  message?: string
  error?: string
}

interface HealthResponse {
  status: string
  timestamp: string
  services: {
    mongodb?: ServiceStatus
    redis?: ServiceStatus
    cassandra?: ServiceStatus
    rabbitmq?: ServiceStatus
  }
}

export default function ConnectionStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/health")
        const data = await response.json()
        setHealth(data)
        setError(null)
      } catch (err) {
        setError("Failed to fetch health status")
        console.error("[v0] Health check error:", err)
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500/20 text-green-700 border-green-500"
      case "unhealthy":
        return "bg-red-500/20 text-red-700 border-red-500"
      default:
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500"
    }
  }

  const getStatusDot = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500"
      case "unhealthy":
        return "bg-red-500"
      default:
        return "bg-yellow-500"
    }
  }

  if (loading && !health) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Database Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">Checking connections...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Database Connections</CardTitle>
          <Badge className={`${getStatusColor(health?.status || "checking")} border`}>
            {health?.status === "healthy" ? "All Connected" : "Degraded"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MongoDB */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/50 border border-slate-600">
            <div
              className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${getStatusDot(health?.services.mongodb?.status || "checking")}`}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">MongoDB Atlas</p>
              <p className="text-xs text-slate-400 truncate">
                {health?.services.mongodb?.message || health?.services.mongodb?.error || "Checking..."}
              </p>
            </div>
          </div>

          {/* Redis */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/50 border border-slate-600">
            <div
              className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${getStatusDot(health?.services.redis?.status || "checking")}`}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">Redis (Upstash)</p>
              <p className="text-xs text-slate-400 truncate">
                {health?.services.redis?.message || health?.services.redis?.error || "Checking..."}
              </p>
            </div>
          </div>

          {/* Cassandra */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/50 border border-slate-600">
            <div
              className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${getStatusDot(health?.services.cassandra?.status || "checking")}`}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">Cassandra (Astra)</p>
              <p className="text-xs text-slate-400 truncate">
                {health?.services.cassandra?.message || health?.services.cassandra?.error || "Checking..."}
              </p>
            </div>
          </div>

          {/* RabbitMQ */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/50 border border-slate-600">
            <div
              className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${getStatusDot(health?.services.rabbitmq?.status || "checking")}`}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">RabbitMQ (CloudAMQP)</p>
              <p className="text-xs text-slate-400 truncate">
                {health?.services.rabbitmq?.message || health?.services.rabbitmq?.error || "Checking..."}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}

        <p className="text-xs text-slate-500 mt-4">
          Last updated: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : "Never"}
        </p>
      </CardContent>
    </Card>
  )
}
