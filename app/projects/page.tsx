import type { Metadata } from 'next'
import { PageHeading } from '@/components/page-heading'
import { ProjectsGallery } from '@/components/projects/projects-gallery'
import { getAllProjects, getAllTechTags } from '@/lib/projects'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Projects — Sukhjot',
  description: 'A selection of full-stack projects, systems, and interfaces.',
}

export default async function ProjectsPage() {
  const projects = await getAllProjects()
  const techTags = await getAllTechTags()

  // Replace base64 images with API URLs so the RSC payload stays small
  const clientProjects = projects.map((p) => ({
    ...p,
    image: `/api/projects/${p.slug}/image`,
    gallery: p.gallery.map((_, i) =>
      `/api/projects/${p.slug}/gallery/${i}`,
    ),
  }))

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32 md:px-8 md:pt-40">
      <PageHeading
        eyebrow="Portfolio"
        title="My Work"
        subtitle="A selection of systems and products I've designed and shipped. Filter by the tools behind each one."
      />
      <ProjectsGallery projects={clientProjects} allTech={techTags} />
    </div>
  )
}
