"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, Clock3, DollarSign, History } from "lucide-react"

type Cycle = {
  id: string
  startTime: string
  endTime: string
  lengthMinutes: number
  avgTemperature: number
  avgHumidity: number
  securityIncidents: number
  estimatedCost: number
}

type CycleMetrics = {
  totalCycles: number
  averageLengthMinutes: number
  totalSecurityIncidents: number
  averageCost: number
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string
  icon: JSX.Element
}) {
  return (
    <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-zinc-500">{title}</p>
        <div className="p-2 rounded-lg bg-zinc-800">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

export default function PastCyclesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [metrics, setMetrics] = useState<CycleMetrics>({
    totalCycles: 0,
    averageLengthMinutes: 0,
    totalSecurityIncidents: 0,
    averageCost: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCycles = async () => {
      try {
        const response = await fetch("/api/cycles?sampleLimit=1200", { cache: "no-store" })
        const result = await response.json()

        if (!response.ok || !result?.success) return

        setCycles(Array.isArray(result.cycles) ? (result.cycles as Cycle[]) : [])
        setMetrics((result.metrics as CycleMetrics) ?? metrics)
      } catch {
        // Keep empty fallback values if API fails.
      } finally {
        setIsLoading(false)
      }
    }

    loadCycles()
  }, [])

  const formattedMetrics = useMemo(
    () => ({
      averageLength: `${metrics.averageLengthMinutes} min`,
      securityIncidents: `${metrics.totalSecurityIncidents}`,
      averageCost: `$${metrics.averageCost.toFixed(2)}`,
      totalCycles: `${metrics.totalCycles}`,
    }),
    [metrics]
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <header className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Past Cycles</h1>
            <p className="text-zinc-500 mt-1">Historical dryer cycles and performance metrics</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 text-sm rounded-full border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            title="Average Length"
            value={formattedMetrics.averageLength}
            icon={<Clock3 className="w-4 h-4 text-cyan-400" />}
          />
          <MetricCard
            title="Security Incidents"
            value={formattedMetrics.securityIncidents}
            icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
          />
          <MetricCard
            title="Average Cost"
            value={formattedMetrics.averageCost}
            icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
          />
          <MetricCard
            title="Total Cycles"
            value={formattedMetrics.totalCycles}
            icon={<History className="w-4 h-4 text-blue-400" />}
          />
        </div>

        <section className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Cycle History</h2>

          {isLoading ? (
            <p className="text-zinc-500">Loading past cycles...</p>
          ) : cycles.length === 0 ? (
            <p className="text-zinc-500">
              No completed cycles detected yet. A cycle is counted when vibration transitions from
              active to complete.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-400 border-b border-zinc-800">
                    <th className="py-3 pr-4">Start</th>
                    <th className="py-3 pr-4">End</th>
                    <th className="py-3 pr-4">Length</th>
                    <th className="py-3 pr-4">Avg Temp</th>
                    <th className="py-3 pr-4">Avg Humidity</th>
                    <th className="py-3 pr-4">Incidents</th>
                    <th className="py-3">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {cycles.map((cycle) => (
                    <tr key={cycle.id} className="border-b border-zinc-900">
                      <td className="py-3 pr-4 text-zinc-200">
                        {new Date(cycle.startTime).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-zinc-200">
                        {new Date(cycle.endTime).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-zinc-300">{cycle.lengthMinutes} min</td>
                      <td className="py-3 pr-4 text-zinc-300">{cycle.avgTemperature} °C</td>
                      <td className="py-3 pr-4 text-zinc-300">{cycle.avgHumidity} %</td>
                      <td className="py-3 pr-4 text-zinc-300">{cycle.securityIncidents}</td>
                      <td className="py-3 text-zinc-300">${cycle.estimatedCost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
