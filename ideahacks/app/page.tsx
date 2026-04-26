"use client"

import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react"
import { Droplets, Thermometer, Activity, TrendingUp, CheckCircle, Shield, ShieldAlert, ShieldOff } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { SettingsModal } from "@/components/settings-modal"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type SensorPoint = {
  humidity: number
  temperature: number
  vibration_status?: boolean
  created_at: string
}

function HumidityGauge({ value }: { value: number }) {
  const radius = 120
  const strokeWidth = 16
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="currentColor"
          className="text-zinc-800"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
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

function StatusIndicator({ isActive, isArmed, onArm, onDisarm }: {
  isActive: boolean
  isArmed: boolean
  onArm: () => void
  onDisarm: () => void
}) {
  return (
    <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-xl ${isActive ? "bg-emerald-500/10" : isArmed ? "bg-red-500/10" : "bg-zinc-700/30"}`}>
          {isArmed ? (
            <ShieldAlert className="w-6 h-6 text-red-400" />
          ) : (
            <Activity className={`w-6 h-6 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />
          )}
        </div>
        <span className="text-zinc-400 font-medium">Drum Status</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className={`w-4 h-4 rounded-full ${isActive ? "bg-emerald-500" : isArmed ? "bg-red-500" : "bg-zinc-600"}`}
          />
          {(isActive || isArmed) && (
            <div className={`absolute inset-0 w-4 h-4 rounded-full animate-ping opacity-75 ${isActive ? "bg-emerald-500" : "bg-red-500"}`} />
          )}
        </div>
        <span className={`text-2xl font-semibold ${isActive ? "text-emerald-400" : isArmed ? "text-red-400" : "text-zinc-500"}`}>
          {isActive ? "Tumbling" : isArmed ? "Armed" : "Cycle Complete"}
        </span>
      </div>
      {isActive && (
        <p className="mt-3 text-sm text-zinc-500">Vibration detected - Drum is spinning</p>
      )}
      {!isActive && isArmed && (
        <p className="mt-3 text-sm text-zinc-500">Monitoring for tampering...</p>
      )}
      {!isActive && !isArmed && (
        <p className="mt-3 text-sm text-zinc-500">No vibration - Ready to unload</p>
      )}

      {!isActive && (
        <button
          onClick={isArmed ? onDisarm : onArm}
          className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            isArmed
              ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
              : "bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          {isArmed ? (
            <>
              <ShieldOff className="w-4 h-4" />
              Disarm
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              Arm Security
            </>
          )}
        </button>
      )}
    </div>
  )
}

function DryingCurveChart({ points }: { points: SensorPoint[] }) {
  const chartData = points.map((point) => ({
    humidity: Math.round(point.humidity),
    temperature: Math.round(point.temperature),
    time: new Date(point.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }))

  const hasEnoughData = chartData.length > 1

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

      <div className="h-56">
        {hasEnoughData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#3f3f46" strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tick={{ fill: "#71717a", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                yAxisId="humidity"
                domain={[0, 100]}
                tick={{ fill: "#71717a", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <YAxis
                yAxisId="temperature"
                orientation="right"
                domain={[0, 80]}
                tick={{ fill: "#71717a", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  color: "#ffffff",
                  borderRadius: "0.75rem",
                }}
              />
              <Line
                yAxisId="humidity"
                type="monotone"
                dataKey="humidity"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={false}
                name="Humidity %"
              />
              <Line
                yAxisId="temperature"
                type="monotone"
                dataKey="temperature"
                stroke="#fb923c"
                strokeWidth={2}
                dot={false}
                name="Temperature °C"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-zinc-700 text-zinc-500 text-sm">
            Waiting for more sensor readings to build chart...
          </div>
        )}
      </div>

      <div className="mt-10 pt-4 border-t border-zinc-800 flex items-center justify-between text-sm">
        <span className="text-zinc-500">Data points</span>
        <span className="text-white font-medium">{chartData.length}</span>
      </div>
    </div>
  )
}

export default function LaundryDashboard() {
  const [humidity, setHumidity] = useState(67)
  const [temperature, setTemperature] = useState(42)
  const [isVibrating, setIsVibrating] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [history, setHistory] = useState<SensorPoint[]>([])
  const [isArmed, setIsArmed] = useState(false)

  const previousVibratingRef = useRef(true)
  const clothesNotifiedRef = useRef(false)
  const cycleNotifiedRef = useRef(false)
  const tamperNotifiedRef = useRef(false)

  const getEmail = useCallback((): string | null => {
    try {
      const stored = localStorage.getItem("drypod-notifications")
      if (!stored) return null
      const parsed = JSON.parse(stored)
      return parsed.email || null
    } catch {
      return null
    }
  }, [])

  const notify = useCallback(async (type: string, toastMsg: string) => {
    toast.success(toastMsg, { duration: 6000, position: "top-center" })

    const email = getEmail()
    if (!email) return

    try {
      await fetch("/api/notify/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type }),
      })
    } catch (err) {
      console.error("Email notification failed:", err)
    }
  }, [getEmail])

  useEffect(() => {
    const loadSensorData = async () => {
      try {
        const response = await fetch("/api/sensor?historyLimit=24", { cache: "no-store" })
        const result = await response.json()

        if (!response.ok || !result?.success) return

        const latest = result.data as SensorPoint | null
        const nextHistory = Array.isArray(result.history) ? (result.history as SensorPoint[]) : []

        if (latest) {
          setHumidity(latest.humidity)
          setTemperature(latest.temperature)
          setIsVibrating(Boolean(latest.vibration_status))
          setLastUpdated(latest.created_at ?? null)
        }

        setHistory(nextHistory)
      } catch {
        // Keep default fallback values if fetch fails.
      }
    }

    loadSensorData()
    const refreshHandle = setInterval(loadSensorData, 10_000)
    return () => clearInterval(refreshHandle)
  }, [])

  // 1. "Take Your Clothes out" — humidity < 7% or temperature < 54.4°C (while cycle was running)
  useEffect(() => {
    if (clothesNotifiedRef.current) return
    if (!isVibrating && previousVibratingRef.current) {
      // Just stopped — check thresholds on next readings
    }
    if (!isVibrating && (humidity < 7 || temperature < 54.4)) {
      clothesNotifiedRef.current = true
      notify("clothes", "Take your clothes out of the dryer!")
    }
  }, [humidity, temperature, isVibrating, notify])

  // 2. "Your Cycle is Finished" — vibration stops after running
  useEffect(() => {
    const wasVibrating = previousVibratingRef.current
    const isNowVibrating = isVibrating

    if (wasVibrating && !isNowVibrating && !cycleNotifiedRef.current) {
      cycleNotifiedRef.current = true
      notify("finished", "Your cycle is finished!")
    }

    if (isNowVibrating) {
      // Cycle started again — reset all flags
      cycleNotifiedRef.current = false
      clothesNotifiedRef.current = false
      tamperNotifiedRef.current = false
      setIsArmed(false)
    }

    previousVibratingRef.current = isNowVibrating
  }, [isVibrating, notify])

  // 3. Tampering — armed + movement detected
  useEffect(() => {
    if (!isArmed || tamperNotifiedRef.current) return

    if (isVibrating) {
      tamperNotifiedRef.current = true
      notify("tamper", "Security alert: your laundry has been tampered with!")
    }
  }, [isArmed, isVibrating, notify])

  const handleArm = () => {
    setIsArmed(true)
    tamperNotifiedRef.current = false
    toast("Security armed — you'll be notified if tampering is detected.", {
      position: "top-center",
      duration: 3000,
    })
  }

  const handleDisarm = () => {
    setIsArmed(false)
    tamperNotifiedRef.current = false
    toast("Security disarmed.", { position: "top-center", duration: 2000 })
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <header className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Image 
            src="/logo.png" 
            alt="DryPod Logo" 
            width={120} 
            height={32} 
            className="h-30 w-auto object-contain" 
            />
            <p className="text-zinc-500 mt-1">
              {lastUpdated ? `Last reading: ${new Date(lastUpdated).toLocaleString()}` : "Latest sensor reading"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SettingsModal />
            <Link
              href="/past-cycles"
              className="px-4 py-2 text-sm rounded-full border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Past Cycles
            </Link>
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-zinc-400">Connected</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TemperatureCard value={Math.round(temperature)} />
              <StatusIndicator
                isActive={isVibrating}
                isArmed={isArmed}
                onArm={handleArm}
                onDisarm={handleDisarm}
              />
            </div>

            <DryingCurveChart points={history} />
          </div>
        </div>
      </main>
    </div>
  )
}
