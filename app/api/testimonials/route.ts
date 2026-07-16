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

export async function POST(request: Request) {
  try {
    await connectDB()
    const body = await request.json()
    const testimonial = await Testimonial.create(body)
    return NextResponse.json(testimonial, { status: 201 })
  } catch (error) {
    console.error('POST /api/testimonials error:', error)
    return NextResponse.json(
      { error: 'Failed to create testimonial' },
      { status: 500 },
    )
  }
}
