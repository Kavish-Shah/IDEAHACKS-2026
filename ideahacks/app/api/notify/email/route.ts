import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, type } = await request.json()
    const result = await sendEmail(email, type)
    return NextResponse.json(result, { status: result.success ? 200 : 500 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Email notification error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
