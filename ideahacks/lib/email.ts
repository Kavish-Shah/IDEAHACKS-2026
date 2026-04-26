import nodemailer from 'nodemailer'

export type EmailResult = {
  success: boolean
  message?: string
  error?: string
}

const SUBJECTS: Record<string, string> = {
  clothes: 'Take Your Clothes out of the Dryer',
  finished: 'Your Cycle is Finished',
  tamper: 'Security Alert: Laundry Tampered With',
}

const COLORS: Record<string, string> = {
  clothes: '#f59e0b',
  finished: '#10b981',
  tamper: '#ef4444',
}

export async function sendEmail(to: string, type: string = 'finished'): Promise<EmailResult> {
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { success: false, error: 'Invalid email address' }
  }

  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!user || !pass) {
    return {
      success: false,
      error: 'Email credentials not configured. Set SMTP_USER and SMTP_PASSWORD in .env.local',
    }
  }

  const subject = SUBJECTS[type] ?? SUBJECTS.finished
  const color = COLORS[type] ?? COLORS.finished

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })

  await transporter.sendMail({
    from: user,
    to,
    subject,
    text: subject,
    html: `
      <div style="font-family: -apple-system, sans-serif; background: #0a0a0a; padding: 40px 20px;">
        <div style="max-width: 480px; margin: 0 auto; background: #18181b; border: 1px solid #3f3f46; border-radius: 16px; padding: 40px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: ${color};">${subject}</h1>
          <p style="margin: 16px 0 0; color: #a1a1aa; font-size: 16px;">Sent from DryPod</p>
        </div>
      </div>
    `,
  })

  return { success: true, message: `Email sent: ${subject}` }
}
