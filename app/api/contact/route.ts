import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ContactMessage } from '@/lib/models'

async function sendBrevoEmail({
  name,
  email,
  message,
}: {
  name: string
  email: string
  message: string
}) {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'sukhjotsingh441@gmail.com'
  const senderName = process.env.BREVO_SENDER_NAME || 'Portfolio Contact'
  const toEmail = process.env.BREVO_TO_EMAIL || 'sukhjotsingh441@gmail.com'
  const toName = process.env.BREVO_TO_NAME || 'Sukhjot'

  console.log('[Brevo] Preparing email...')
  console.log('[Brevo] API key set:', !!apiKey)
  console.log('[Brevo] Sender:', senderEmail, `(${senderName})`)
  console.log('[Brevo] Recipient:', toEmail, `(${toName})`)
  console.log('[Brevo] Reply-To:', email, `(${name})`)

  if (!apiKey) {
    console.warn('[Brevo] BREVO_API_KEY not set — skipping email notification')
    return
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#d4a853">New Contact Form Message</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;font-weight:600;color:#555">Name</td><td style="padding:8px 0">${name}</td></tr>
        <tr><td style="padding:8px 0;font-weight:600;color:#555">Email</td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
      <p style="color:#333;line-height:1.6;white-space:pre-wrap">${message}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
      <p style="font-size:12px;color:#999">Sent from your portfolio contact form.</p>
    </div>
  `

  console.log('[Brevo] Sending request to Brevo API...')
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: toEmail, name: toName }],
      subject: `New portfolio message from ${name}`,
      htmlContent: html,
      replyTo: { email, name },
    }),
  })

  console.log('[Brevo] Response status:', res.status)

  if (!res.ok) {
    const text = await res.text()
    console.error('[Brevo] Email send FAILED:', res.status, text)
  } else {
    console.log('[Brevo] Email sent successfully!')
  }
}

export async function POST(request: Request) {
  try {
    await connectDB()
    const body = await request.json()

    if (!body.name || !body.email || !body.message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 },
      )
    }

    const message = await ContactMessage.create({
      name: body.name,
      email: body.email,
      message: body.message,
    })

    // Fire-and-forget email notification — don't block the response
    sendBrevoEmail({
      name: body.name,
      email: body.email,
      message: body.message,
    }).catch((err) => console.error('Brevo email error:', err))

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('POST /api/contact error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 },
    )
  }
}
