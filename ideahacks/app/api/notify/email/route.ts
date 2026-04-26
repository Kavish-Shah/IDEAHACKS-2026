import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

type EmailPayload = {
  email: string
  humidity: number
  temperature: number
  duration: number
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailPayload = await request.json()
    const { email, humidity, temperature, duration } = body

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpUser = process.env.SMTP_USER
    const smtpPassword = process.env.SMTP_PASSWORD
    const smtpFrom = process.env.SMTP_FROM || 'noreply@drypod.com'

    // If SMTP credentials aren't set, log a warning and still return success
    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.warn(
        'SMTP credentials not configured. Email notification skipped. Configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD to enable email.'
      )
      return NextResponse.json(
        { success: true, message: 'Email credentials not configured' },
        { status: 200 }
      )
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort || '587'),
      secure: smtpPort === '465',
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    })

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #ffffff; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #18181b; border: 1px solid #3f3f46; border-radius: 16px; padding: 32px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #10b981;">✓ Cycle Complete!</h1>
            <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 16px;">Your dryer cycle has finished</p>
          </div>
          
          <div style="background: #27272a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <p style="margin: 0 0 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Final Humidity</p>
                <p style="margin: 0; font-size: 24px; font-weight: 600; color: #22d3ee;">${Math.round(humidity)}%</p>
              </div>
              <div>
                <p style="margin: 0 0 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Temperature</p>
                <p style="margin: 0; font-size: 24px; font-weight: 600; color: #fb923c;">${Math.round(temperature)}°C</p>
              </div>
            </div>
            <div>
              <p style="margin: 0 0 8px 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Duration</p>
              <p style="margin: 0; font-size: 24px; font-weight: 600; color: #3b82f6;">${Math.round(duration)} minutes</p>
            </div>
          </div>

          <div style="text-align: center; color: #71717a; font-size: 14px;">
            <p style="margin: 0;">Ready to unload your clothes!</p>
          </div>
        </div>
      </div>
    `

    const mailOptions = {
      from: smtpFrom,
      to: email,
      subject: '✓ Your Dryer Cycle is Complete!',
      html: htmlContent,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json(
      { success: true, message: 'Email sent successfully' },
      { status: 200 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Email notification error:', message)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
