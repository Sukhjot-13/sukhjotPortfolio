import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Project } from '@/lib/models'

/**
 * Serves a project's main image from the base64 data stored in MongoDB.
 * Returns a proper binary response so the browser can cache it independently
 * of the RSC payload.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await connectDB()
    const { slug } = await params
    const project = await Project.findOne({ slug }).select('image').lean()
    if (!project || !project.image) {
      return new NextResponse(null, { status: 404 })
    }

    const raw = project.image as string

    // Handle data URIs: "data:image/png;base64,iVBOR..."
    // Also accept raw base64 strings for backwards compat.
    const match = raw.match(/^data:(image\/\w+);base64,(.+)$/)
    if (match) {
      const mime = match[1]
      const buf = Buffer.from(match[2], 'base64')
      return new NextResponse(buf, {
        headers: {
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    }

    // Raw base64 — guess PNG as default
    const buf = Buffer.from(raw, 'base64')
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('GET /api/projects/[slug]/image error:', error)
    return new NextResponse(null, { status: 500 })
  }
}
