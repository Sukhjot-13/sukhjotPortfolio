import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { ContactMessage } from '@/lib/models'

export async function GET() {
  try {
    await connectDB()
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .lean()
    return NextResponse.json(messages)
  } catch (error) {
    console.error('GET /api/contact/messages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 },
    )
  }
}
