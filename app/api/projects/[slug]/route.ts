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
    const project = await Project.findOne({ slug }).lean()
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 },
      )
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await connectDB()
    const { slug } = await params
    const body = await request.json()
    const project = await Project.findOneAndUpdate({ slug }, body, {
      new: true,
    }).lean()
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 },
      )
    }
    return NextResponse.json(project)
  } catch (error) {
    console.error(`PUT /api/projects/[slug] error:`, error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await connectDB()
    const { slug } = await params
    const project = await Project.findOneAndDelete({ slug }).lean()
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 },
      )
    }
    return NextResponse.json({ message: 'Project deleted' })
  } catch (error) {
    console.error(`DELETE /api/projects/[slug] error:`, error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 },
    )
  }
}
