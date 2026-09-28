import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Testimonial } from '@/lib/models'

export async function GET() {
  try {
    await connectDB()
    const testimonials = await Testimonial.find().sort({ order: 1 }).lean()
    return NextResponse.json(testimonials)
  } catch (error) {
    console.error('GET /api/testimonials error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch testimonials' },
      { status: 500 },
    )
  }
}
