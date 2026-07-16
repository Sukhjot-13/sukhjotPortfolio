import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProjectDetail } from '@/components/projects/project-detail'
import { getAllProjects, getProjectBySlug, getNextProject } from '@/lib/projects'

export async function generateStaticParams() {
  try {
    const projects = await getAllProjects()
    return projects.map((p) => ({ slug: p.slug }))
  } catch {
    // DB may not be reachable during build (e.g. on Vercel).
    // Page will be server-rendered on demand instead.
    return []
  }
}

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
  const next = await getNextProject(slug)
  return <ProjectDetail project={project} next={next ?? project} />
}
