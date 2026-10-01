import { logServerError, withManagerLogs } from '@/lib/manager'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Project } from '@/lib/models'

async function handleGET(request: Request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const tech = searchParams.get('tech')

    const filter: Record<string, unknown> = {}
    if (tech) filter.tech = tech

    const docs = await Project.find(filter).sort({ createdAt: -1 }).lean()
    // Replace base64 images with API URLs to keep the response small
    const projects = docs.map((p) => ({
      ...p,
      image: `/api/projects/${p.slug}/image`,
      gallery: ((p.gallery || []) as string[]).map((_, i) =>
        `/api/projects/${p.slug}/gallery/${i}`,
      ),
    }))
    return NextResponse.json(projects)
  } catch (error) {
    console.error('GET /api/projects error:', error)
    logServerError('portfolio_request_failed', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 },
    )
  }
}

export const GET = withManagerLogs(handleGET)
