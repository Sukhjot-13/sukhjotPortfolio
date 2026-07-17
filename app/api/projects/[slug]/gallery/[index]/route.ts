import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Project } from '@/lib/models'

/**
 * Serves a single gallery image for a project from the base64 data
 * stored in MongoDB.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; index: string }> },
) {
  try {
    await connectDB()
    const { slug, index } = await params
    const i = parseInt(index, 10)
    const project = await Project.findOne({ slug }).select('gallery').lean()
    if (!project || !project.gallery || !Array.isArray(project.gallery) || !project.gallery[i]) {
      return new NextResponse(null, { status: 404 })
    }

    const raw = project.gallery[i] as string

    // Handle data URIs
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

    // Raw base64 — guess PNG
    const buf = Buffer.from(raw, 'base64')
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('GET /api/projects/[slug]/gallery/[index] error:', error)
    return new NextResponse(null, { status: 500 })
  }
}
