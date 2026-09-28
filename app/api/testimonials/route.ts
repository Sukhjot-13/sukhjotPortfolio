import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Testimonial } from '@/lib/models'
import { logServerError } from '@/lib/manager'

export async function GET() {
  try {
    await connectDB()
    const testimonials = await Testimonial.find().sort({ order: 1 }).lean()
    return NextResponse.json(testimonials)
  } catch (error) {
    console.error('GET /api/testimonials error:', error)
    logServerError('testimonials_fetch_failed', error)
    return NextResponse.json(
      { error: 'Failed to fetch testimonials' },
      { status: 500 },
    )
  }
}
