"use client"

import { useState, useEffect } from "react"
import { Droplets, Thermometer, Activity, TrendingUp } from "lucide-react"

// Circular Gauge Component
function HumidityGauge({ value }: { value: number }) {
  const radius = 120
  const strokeWidth = 16
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          stroke="currentColor"
          className="text-zinc-800"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress circle */}
        <circle
          stroke="url(#gradient)"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <Droplets className="w-8 h-8 text-cyan-400 mb-2" />
        <span className="text-5xl font-bold text-white">{value}</span>
        <span className="text-lg text-zinc-400 mt-1">% Humidity</span>
      </div>
    </div>
  )
}

// Temperature Card Component
function TemperatureCard({ value }: { value: number }) {
  return (
    <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-xl bg-orange-500/10">
          <Thermometer className="w-6 h-6 text-orange-400" />
        </div>
        <span className="text-zinc-400 font-medium">Temperature</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold text-white">{value}</span>
        <span className="text-xl text-zinc-500">°C</span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
            style={{ width: `${(value / 80) * 100}%` }}
          />
        </div>
        <span className="text-xs text-zinc-500">80°C max</span>
      </div>
    </div>
  )
}

// Status Indicator Component
function StatusIndicator({ isActive }: { isActive: boolean }) {
  return (
    <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-xl ${isActive ? "bg-emerald-500/10" : "bg-zinc-700/30"}`}>
          <Activity className={`w-6 h-6 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />
        </div>
        <span className="text-zinc-400 font-medium">Drum Status</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className={`w-4 h-4 rounded-full ${isActive ? "bg-emerald-500" : "bg-zinc-600"}`}
          />
          {isActive && (
            <div className="absolute inset-0 w-4 h-4 rounded-full bg-emerald-500 animate-ping opacity-75" />
          )}
        </div>
        <span className={`text-2xl font-semibold ${isActive ? "text-emerald-400" : "text-zinc-500"}`}>
          {isActive ? "Tumbling" : "Cycle Complete"}
        </span>
      </div>
      {isActive && (
        <p className="mt-3 text-sm text-zinc-500">Vibration detected • Drum is spinning</p>
      )}
      {!isActive && (
        <p className="mt-3 text-sm text-zinc-500">No vibration • Ready to unload</p>
      )}
    </div>
  )
}

// Drying Curve Placeholder Component
function DryingCurveChart() {
  return (
    <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-500/10">
            <TrendingUp className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">Drying Curve</h3>
            <p className="text-sm text-zinc-500">Humidity over time</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="text-zinc-400">Humidity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-400" />
            <span className="text-zinc-400">Temperature</span>
          </div>
        </div>
      </div>
      
      {/* Chart Placeholder */}
      <div className="relative h-48 flex items-end justify-between gap-1 px-2">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-zinc-600 -ml-1">
          <span>100%</span>
          <span>50%</span>
          <span>0%</span>
        </div>
        
        {/* Placeholder bars representing drying curve */}
        {[95, 88, 76, 65, 52, 45, 38, 32, 28, 25, 22, 20].map((height, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-gradient-to-t from-cyan-500/80 to-blue-500/80 rounded-t transition-all duration-300 hover:from-cyan-400 hover:to-blue-400"
              style={{ height: `${height}%` }}
            />
          </div>
        ))}
        
        {/* X-axis labels */}
        <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-zinc-600 px-2">
          <span>0m</span>
          <span>30m</span>
          <span>60m</span>
        </div>
      </div>
      
      <div className="mt-10 pt-4 border-t border-zinc-800 flex items-center justify-between text-sm">
        <span className="text-zinc-500">Estimated time remaining</span>
        <span className="text-white font-medium">~12 minutes</span>
      </div>
    </div>
  )
}

export default function LaundryDashboard() {
  const [humidity, setHumidity] = useState(67)
  const [temperature, setTemperature] = useState(42)
  const [isVibrating, setIsVibrating] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    const loadLatestSensorData = async () => {
      try {
        const response = await fetch("/api/sensor", { cache: "no-store" })
        const result = await response.json()

        if (!response.ok || !result?.success || !result?.data) return

        const latest = result.data as {
          humidity: number
          temperature: number
          vibration_status: boolean
          created_at?: string
        }

        setHumidity(latest.humidity)
        setTemperature(latest.temperature)
        setIsVibrating(latest.vibration_status)
        setLastUpdated(latest.created_at ?? null)
      } catch {
        // Keep default fallback values if fetch fails.
      }
    }

    loadLatestSensorData()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Smart Laundry Monitor</h1>
            <p className="text-zinc-500 mt-1">
              {lastUpdated ? `Last reading: ${new Date(lastUpdated).toLocaleString()}` : "Latest sensor reading"}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-zinc-400">Connected</span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Humidity Gauge */}
          <div className="lg:col-span-1 flex items-center justify-center">
            <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 w-full flex flex-col items-center">
              <HumidityGauge value={Math.round(humidity)} />
              <div className="mt-6 grid grid-cols-2 gap-4 w-full">
                <div className="text-center p-3 bg-zinc-800/50 rounded-xl">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Target</p>
                  <p className="text-lg font-semibold text-white mt-1">20%</p>
                </div>
                <div className="text-center p-3 bg-zinc-800/50 rounded-xl">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Start</p>
                  <p className="text-lg font-semibold text-white mt-1">95%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Stats and Chart */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Top Row - Temp and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TemperatureCard value={Math.round(temperature)} />
              <StatusIndicator isActive={isVibrating} />
            </div>

            {/* Bottom Row - Drying Curve */}
            <DryingCurveChart />
          </div>
        </div>

      </main>
    </div>
  )
}
