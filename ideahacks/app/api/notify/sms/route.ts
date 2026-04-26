import { NextRequest, NextResponse } from 'next/server'
import { sendSms } from '@/lib/sms'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()
    const result = await sendSms(phoneNumber)
    return NextResponse.json(result, { status: result.success ? 200 : 500 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('SMS notification error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
