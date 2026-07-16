import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ContactMessage } from '@/lib/models'

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
    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('POST /api/contact error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 },
    )
  }
}
