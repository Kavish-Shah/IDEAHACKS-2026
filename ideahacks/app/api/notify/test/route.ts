import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, email } = await request.json()

    const results = {
      sms: null as { success: boolean; message: string } | null,
      email: null as { success: boolean; message: string } | null,
    }

    // Test SMS
    if (phoneNumber) {
      try {
        const smsRes = await fetch(new URL('/api/notify/sms', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber,
            humidity: 35.5,
            temperature: 62.3,
            duration: 45.2,
          }),
        })
        const smsData = await smsRes.json()
        results.sms = smsData
      } catch (error) {
        results.sms = {
          success: false,
          message: error instanceof Error ? error.message : 'SMS test failed',
        }
      }
    }

    // Test Email
    if (email) {
      try {
        const emailRes = await fetch(new URL('/api/notify/email', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            humidity: 35.5,
            temperature: 62.3,
            duration: 45.2,
          }),
        })
        const emailData = await emailRes.json()
        results.email = emailData
      } catch (error) {
        results.email = {
          success: false,
          message: error instanceof Error ? error.message : 'Email test failed',
        }
      }
    }

    return NextResponse.json(
      { success: true, results },
      { status: 200 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
