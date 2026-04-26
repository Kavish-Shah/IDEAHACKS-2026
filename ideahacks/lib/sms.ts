export type SmsResult = {
  success: boolean
  message?: string
  error?: string
  sid?: string
}

export async function sendSms(phoneNumber: string): Promise<SmsResult> {
  const stripped = (phoneNumber ?? '').replace(/\D/g, '')
  if (!stripped || !/^[1-9]\d{1,14}$/.test(stripped)) {
    return { success: false, error: 'Invalid phone number format' }
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      error: 'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env.local',
    }
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: phoneNumber,
        Body: 'Cycle Complete!',
      }).toString(),
    }
  )

  if (!response.ok) {
    const errBody = await response.text()
    console.error('Twilio API error:', errBody)
    return { success: false, error: 'Failed to send SMS' }
  }

  const data = await response.json()
  return { success: true, message: 'SMS sent successfully', sid: data.sid }
}
