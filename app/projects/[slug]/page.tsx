import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProjectDetail } from '@/components/projects/project-detail'
import { getProjectBySlug, getNextProject } from '@/lib/projects'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return { title: 'Project not found' }
  return {
    title: `${project.title} — Sukhjot`,
    description: project.blurb,
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) notFound()
  const next = await getNextProject(slug) ?? project

  // Replace base64 data with API URLs so the RSC payload stays small.
  // Images are served separately via /api/projects/[slug]/image and
  // /api/projects/[slug]/gallery/[index].
  const clientProject = {
    ...project,
    image: `/api/projects/${project.slug}/image`,
    gallery: project.gallery.map((_, i) =>
      `/api/projects/${project.slug}/gallery/${i}`,
    ),
  }
  const clientNext = {
    ...next,
    image: `/api/projects/${next.slug}/image`,
    gallery: next.gallery.map((_, i) =>
      `/api/projects/${next.slug}/gallery/${i}`,
    ),
  }

  return <ProjectDetail project={clientProject} next={clientNext} />
}
