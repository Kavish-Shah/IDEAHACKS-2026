import { NextRequest, NextResponse } from 'next/server'

type SMSPayload = {
  phoneNumber: string
  humidity: number
  temperature: number
  duration: number
}

export async function POST(request: NextRequest) {
  try {
    const body: SMSPayload = await request.json()
    const { phoneNumber, humidity, temperature, duration } = body

    // Validate phone number format
    if (!phoneNumber || !/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\D/g, ''))) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    // If Twilio credentials aren't set, log a warning and still return success
    if (!accountSid || !authToken || !fromNumber) {
      console.warn(
        'Twilio credentials not configured. SMS notification skipped. Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to enable SMS.'
      )
      return NextResponse.json(
        { success: true, message: 'SMS credentials not configured' },
        { status: 200 }
      )
    }

    const messageBody = `🎉 Cycle Complete! Your dryer cycle finished. Final humidity: ${Math.round(humidity)}%, Temperature: ${Math.round(temperature)}°C, Duration: ${Math.round(duration)} min.`

    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(accountSid + ':' + authToken).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: phoneNumber,
        Body: messageBody,
      }).toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Twilio API error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to send SMS' },
        { status: 500 }
      )
    }

    const data = await response.json()
    return NextResponse.json(
      { success: true, message: 'SMS sent successfully', sid: data.sid },
      { status: 200 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('SMS notification error:', message)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
