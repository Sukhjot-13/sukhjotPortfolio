import type { Metadata } from 'next'
import { PageHeading } from '@/components/page-heading'
import { ProjectsGallery } from '@/components/projects/projects-gallery'
import { getAllProjects, getAllTechTags } from '@/lib/projects'

export const metadata: Metadata = {
  title: 'Projects — Sukhjot',
  description: 'A selection of full-stack projects, systems, and interfaces.',
}

export default async function ProjectsPage() {
  const projects = await getAllProjects()
  const techTags = await getAllTechTags()

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32 md:px-8 md:pt-40">
      <PageHeading
        eyebrow="Portfolio"
        title="My Work"
        subtitle="A selection of systems and products I've designed and shipped. Filter by the tools behind each one."
      />
      <ProjectsGallery projects={projects} allTech={techTags} />
    </div>
  )
}
