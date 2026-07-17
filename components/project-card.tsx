'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { ProjectData } from '@/lib/types'

export function ProjectCard({ project }: { project: ProjectData }) {
  const router = useRouter()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), {
    stiffness: 200,
    damping: 20,
  })
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), {
    stiffness: 200,
    damping: 20,
  })

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  function handleLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/projects/${project.slug}`)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-[250ms] hover:border-gold/50"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={project.image || '/placeholder.svg'}
          alt={project.title}
          className="absolute inset-0 size-full object-cover transition-transform duration-[250ms] ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-display text-xl font-bold tracking-tight">
            {project.title}
          </h3>
          <ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition-colors duration-200 group-hover:text-gold" />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {project.blurb}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.tech.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border bg-secondary px-3 py-1 font-mono text-xs text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-[250ms] group-hover:opacity-100 group-hover:shadow-[inset_0_0_60px_-20px_var(--gold)]" />
      <Link
        href={`/projects/${project.slug}`}
        className="sr-only"
        tabIndex={-1}
      >
        View {project.title}
      </Link>
    </motion.div>
  )
}

export function FeaturedCard({ project }: { project: ProjectData }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group relative block overflow-hidden rounded-3xl border border-border bg-card transition-colors duration-300 hover:border-gold/50"
    >
      <div className="grid md:grid-cols-2">
        <div className="relative aspect-[16/11] overflow-hidden md:aspect-auto">
          <img
            src={project.image || '/placeholder.svg'}
            alt={project.title}
            className="absolute inset-0 size-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/60 md:to-card" />
        </div>

        <div className="flex flex-col justify-center gap-4 p-8 md:p-10">
          <span className="font-mono text-xs uppercase tracking-widest text-gold">
            Featured · {project.date}
          </span>
          <h3 className="font-display text-2xl font-bold tracking-tight transition-transform duration-300 group-hover:-translate-y-0.5 md:text-3xl">
            {project.title}
          </h3>
          <p className="max-w-md leading-relaxed text-muted-foreground">
            {project.blurb}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 transition-transform duration-300 group-hover:-translate-y-0.5">
            {project.tech.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-secondary px-3 py-1 font-mono text-xs text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
          <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-gold">
            View project
            <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          boxShadow: 'inset 0 0 80px -30px var(--gold)',
          transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
        }}
      />
    </Link>
  )
}
