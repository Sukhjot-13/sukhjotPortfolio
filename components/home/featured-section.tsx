'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { FeaturedCard } from '@/components/project-card'
import { GoldButtonLink } from '@/components/gold-button'
import { Reveal } from '@/components/reveal'
import { reveal, stagger, viewportOnce } from '@/lib/motion'
import type { ProjectData } from '@/lib/types'

export function FeaturedSection() {
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data: ProjectData[]) => {
        setProjects(data.filter((p) => p.featured).slice(0, 2))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-32">
      <Reveal>
        <span className="font-mono text-xs uppercase tracking-widest text-gold">
          Selected work
        </span>
        <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-balance md:text-5xl">
          Featured Work
        </h2>
      </Reveal>

      {loading ? (
        <div className="mt-12 flex items-center justify-center py-20">
          <div className="size-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
      ) : (
        <motion.div
          variants={stagger(0.15)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-12 flex flex-col gap-8"
        >
          {projects.length === 0 && (
            <p className="text-center text-muted-foreground">
              No featured projects yet. Add some from the admin panel.
            </p>
          )}
          {projects.map((project) => (
            <motion.div key={project.slug} variants={reveal}>
              <FeaturedCard project={project} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <Reveal className="mt-12 flex justify-center">
        <GoldButtonLink href="/projects" variant="outline">
          See All Projects
          <ArrowRight className="size-4" />
        </GoldButtonLink>
      </Reveal>
    </section>
  )
}
