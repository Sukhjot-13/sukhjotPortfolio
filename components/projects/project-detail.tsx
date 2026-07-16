'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowUpRight, ExternalLink, GitBranch } from 'lucide-react'
import { GoldButtonLink } from '@/components/gold-button'
import { reveal, stagger, viewportOnce, EASE } from '@/lib/motion'
import type { ProjectData } from '@/lib/types'

export function ProjectDetail({
  project,
  next,
}: {
  project: ProjectData
  next: ProjectData
}) {
  return (
    <article className="mx-auto max-w-4xl px-5 pb-24 pt-28 md:px-8 md:pt-32">
      <Link
        href="/projects"
        className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gold"
      >
        <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
        Back to Projects
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="relative mt-6 aspect-[16/9] overflow-hidden rounded-3xl border border-border"
      >
        <Image
          src={project.image || '/placeholder.svg'}
          alt={project.title}
          fill
          priority
          sizes="(max-width: 896px) 100vw, 896px"
          className="object-cover"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.3 }}
        className="mt-10"
      >
        <h1 className="font-display text-3xl font-bold tracking-tight text-balance md:text-5xl">
          {project.title}
        </h1>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="font-mono text-xs uppercase tracking-widest text-gold">
              Role
            </dt>
            <dd className="mt-1 text-foreground">{project.role}</dd>
          </div>
          <div>
            <dt className="font-mono text-xs uppercase tracking-widest text-gold">
              Year
            </dt>
            <dd className="mt-1 text-foreground">{project.date}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="font-mono text-xs uppercase tracking-widest text-gold">
              Links
            </dt>
            <dd className="mt-1 flex gap-3 text-foreground">
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold"
              >
                Demo
              </a>
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold"
              >
                Code
              </a>
            </dd>
          </div>
        </dl>
      </motion.div>

      <motion.div
        variants={stagger(0.06)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mt-6 flex flex-wrap gap-2"
      >
        {project.tech.map((t) => (
          <motion.span
            key={t}
            variants={reveal}
            className="rounded-full border border-border bg-secondary px-3 py-1 font-mono text-xs text-muted-foreground"
          >
            {t}
          </motion.span>
        ))}
      </motion.div>

      <motion.div
        variants={stagger(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mt-10 space-y-5 text-lg leading-relaxed text-muted-foreground"
      >
        {project.description.map((para, i) => (
          <motion.p key={i} variants={reveal}>
            {para}
          </motion.p>
        ))}
      </motion.div>

      <motion.div
        variants={stagger(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="mt-12 grid gap-4 sm:grid-cols-2"
      >
        {project.gallery.map((src, i) => (
          <motion.div
            key={i}
            variants={reveal}
            className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border"
          >
            <Image
              src={src || '/placeholder.svg'}
              alt={`${project.title} screenshot ${i + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={viewportOnce}
        transition={{ duration: 0.4, ease: EASE }}
        className="mt-10 flex flex-wrap gap-3"
      >
        {project.demo ? (
          <GoldButtonLink href={project.demo} external>
            Live Demo
            <ExternalLink className="size-4" />
          </GoldButtonLink>
        ) : null}
        {project.github ? (
          <GoldButtonLink href={project.github} variant="outline" external>
            <GitBranch className="size-4" />
            View Code
          </GoldButtonLink>
        ) : null}
      </motion.div>

      <div className="mt-20 border-t border-border pt-10">
        <span className="font-mono text-xs uppercase tracking-widest text-gold">
          Next Project
        </span>
        <Link
          href={`/projects/${next.slug}`}
          className="group mt-4 flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6 transition-colors duration-300 hover:border-gold/50"
        >
          <div>
            <h3 className="font-display text-2xl font-bold tracking-tight">
              {next.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{next.blurb}</p>
          </div>
          <ArrowUpRight className="size-6 shrink-0 text-muted-foreground transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold" />
        </Link>
      </div>
    </article>
  )
}
