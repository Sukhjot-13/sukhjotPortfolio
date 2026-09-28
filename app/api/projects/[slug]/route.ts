import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Project } from '@/lib/models'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await connectDB()
    const { slug } = await params
    const doc = await Project.findOne({ slug }).lean()
    if (!doc) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 },
      )
    }
    // Replace base64 images with API URLs to keep the response small
    const project = {
      ...doc,
      image: `/api/projects/${slug}/image`,
      gallery: ((doc.gallery || []) as string[]).map((_, i) =>
        `/api/projects/${slug}/gallery/${i}`,
      ),
    }
    return NextResponse.json(project)
  } catch (error) {
    console.error(`GET /api/projects/[slug] error:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 },
    )
  }
}
