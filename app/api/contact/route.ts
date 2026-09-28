import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ContactMessage } from '@/lib/models'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import { logServerError } from '@/lib/manager'
import {
  CONTACT_FIELD_LIMITS,
  escapeHtml,
  exceedsAnyLimit,
  hasDollarKey,
  isHoneypotTripped,
  isNonEmptyString,
  isValidEmail,
} from '@/lib/validate'

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

  // Escape visitor input before interpolating into HTML — the message body
  // is attacker-controlled and would otherwise allow HTML injection into
  // the notification email.
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeMessage = escapeHtml(message)
  // Strip line breaks so the name can't inject extra email headers
  const subjectName = name.replace(/[\r\n]+/g, ' ').slice(0, 100)

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#d4a853">New Contact Form Message</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;font-weight:600;color:#555">Name</td><td style="padding:8px 0">${safeName}</td></tr>
        <tr><td style="padding:8px 0;font-weight:600;color:#555">Email</td><td style="padding:8px 0"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
      <p style="color:#333;line-height:1.6;white-space:pre-wrap">${safeMessage}</p>
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
      subject: `New portfolio message from ${subjectName}`,
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
  const rate = checkRateLimit(clientIp(request.headers))
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many messages sent. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rate.retryAfterSeconds) },
      },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (hasDollarKey(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Honeypot tripped — respond as if it succeeded so the bot learns nothing.
  if (isHoneypotTripped(body)) {
    return NextResponse.json({ ok: true }, { status: 201 })
  }

  try {
    if (
      !isNonEmptyString(body.name) ||
      !isNonEmptyString(body.message) ||
      !isValidEmail(body.email)
    ) {
      return NextResponse.json(
        { error: 'Name, a valid email, and message are required' },
        { status: 400 },
      )
    }

    if (exceedsAnyLimit(body, CONTACT_FIELD_LIMITS)) {
      return NextResponse.json(
        { error: 'One or more fields are too long' },
        { status: 400 },
      )
    }

    await connectDB()
    const message = await ContactMessage.create({
      name: body.name,
      email: body.email,
      message: body.message,
    })

    // Notification is best-effort: the message is already persisted, so a
    // Brevo outage must not turn into a 500 and a duplicate retry.
    try {
      await sendBrevoEmail({
        name: body.name,
        email: body.email,
        message: body.message,
      })
    } catch (emailError) {
      console.error('POST /api/contact email notification error:', emailError)
      logServerError('contact_notification_failed', emailError)
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('POST /api/contact error:', error)
    logServerError('contact_submit_failed', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 },
    )
  }
}
