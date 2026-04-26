import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

type SensorRow = {
  humidity: number
  temperature: number
  vibration_status: boolean
  created_at: string
}

type CycleSummary = {
  id: string
  startTime: string
  endTime: string
  lengthMinutes: number
  avgTemperature: number
  avgHumidity: number
  securityIncidents: number
  estimatedCost: number
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).'
    )
  }

  return createClient(supabaseUrl, supabaseKey)
}

function roundTo(value: number, digits: number) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function summarizeCycle(rows: SensorRow[], cycleIndex: number): CycleSummary | null {
  if (rows.length < 2) return null

  const start = new Date(rows[0].created_at)
  const end = new Date(rows[rows.length - 1].created_at)
  const durationMs = end.getTime() - start.getTime()
  if (durationMs <= 0) return null

  const avgTemperature = rows.reduce((acc, row) => acc + row.temperature, 0) / rows.length
  const avgHumidity = rows.reduce((acc, row) => acc + row.humidity, 0) / rows.length

  // Treat abnormal high-heat samples as potential safety events.
  const securityIncidents = rows.filter((row) => row.temperature >= 75).length

  const lengthMinutes = durationMs / (1000 * 60)
  const estimatedCost = (lengthMinutes / 60) * 0.42 + avgTemperature * 0.005

  return {
    id: `cycle-${cycleIndex + 1}-${rows[0].created_at}`,
    startTime: rows[0].created_at,
    endTime: rows[rows.length - 1].created_at,
    lengthMinutes: roundTo(lengthMinutes, 1),
    avgTemperature: roundTo(avgTemperature, 1),
    avgHumidity: roundTo(avgHumidity, 1),
    securityIncidents,
    estimatedCost: roundTo(estimatedCost, 2),
  }
}

function buildCycles(rows: SensorRow[]): CycleSummary[] {
  const cycles: CycleSummary[] = []
  let activeCycleRows: SensorRow[] = []
  let wasVibrating = false

  for (const row of rows) {
    if (row.vibration_status && !wasVibrating) {
      activeCycleRows = [row]
      wasVibrating = true
      continue
    }

    if (row.vibration_status && wasVibrating) {
      activeCycleRows.push(row)
      continue
    }

    if (!row.vibration_status && wasVibrating) {
      activeCycleRows.push(row)
      const summary = summarizeCycle(activeCycleRows, cycles.length)
      if (summary) cycles.push(summary)
      activeCycleRows = []
      wasVibrating = false
    }
  }

  return cycles.reverse()
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const sampleLimitRaw = Number(searchParams.get('sampleLimit') ?? 1200)
    const sampleLimit = Number.isFinite(sampleLimitRaw)
      ? Math.min(Math.max(Math.floor(sampleLimitRaw), 100), 5000)
      : 1200

    const { data, error } = await supabase
      .from('sensor_data')
      .select('humidity, temperature, vibration_status, created_at')
      .order('created_at', { ascending: true })
      .limit(sampleLimit)

    if (error) throw error

    const rows = (data ?? []) as SensorRow[]
    const cycles = buildCycles(rows)

    const averageLengthMinutes =
      cycles.length > 0
        ? roundTo(cycles.reduce((acc, cycle) => acc + cycle.lengthMinutes, 0) / cycles.length, 1)
        : 0
    const totalSecurityIncidents = cycles.reduce((acc, cycle) => acc + cycle.securityIncidents, 0)
    const averageCost =
      cycles.length > 0
        ? roundTo(cycles.reduce((acc, cycle) => acc + cycle.estimatedCost, 0) / cycles.length, 2)
        : 0

    return NextResponse.json(
      {
        success: true,
        cycles,
        metrics: {
          totalCycles: cycles.length,
          averageLengthMinutes,
          totalSecurityIncidents,
          averageCost,
        },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
