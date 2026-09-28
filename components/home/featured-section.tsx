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
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch('/api/projects')
      .then((r) => {
        if (!r.ok) throw new Error(`status ${r.status}`)
        return r.json()
      })
      .then((data: ProjectData[]) => {
        if (cancelled) return
        setProjects(
          (Array.isArray(data) ? data : []).filter((p) => p.featured).slice(0, 2),
        )
      })
      .catch((err) => {
        console.error('Failed to load featured projects:', err)
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

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
      ) : error ? (
        <div className="mt-12 text-center text-muted-foreground">
          <p>Couldn&apos;t load projects right now. Please try again.</p>
          <button
            type="button"
            onClick={() => {
              setError(false)
              setLoading(true)
              setAttempt((a) => a + 1)
            }}
            className="mt-4 inline-flex items-center rounded-full border border-border px-5 py-2 text-sm font-medium transition-colors hover:border-gold hover:text-gold"
          >
            Retry
          </button>
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
              No featured projects yet. Check back soon.
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
