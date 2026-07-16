'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ProjectCard } from '@/components/project-card'
import type { ProjectData } from '@/lib/types'
import { EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'

export function ProjectsGallery({
  projects,
  allTech,
}: {
  projects: ProjectData[]
  allTech: string[]
}) {
  const [active, setActive] = useState('All')

  const filters = ['All', ...allTech]

  const visible =
    active === 'All'
      ? projects
      : projects.filter((p) => p.tech.includes(active))

  return (
    <div>
      <div className="mt-10 flex flex-wrap gap-2">
        {filters.map((filter, i) => (
          <motion.button
            key={filter}
            type="button"
            onClick={() => setActive(filter)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE, delay: i * 0.08 }}
            className={cn(
              'rounded-full border px-4 py-2 font-mono text-xs transition-colors duration-200',
              active === filter
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-border text-muted-foreground hover:border-gold/50 hover:text-foreground',
            )}
          >
            {filter}
          </motion.button>
        ))}
      </div>

      <motion.div layout className="mt-12 grid gap-6 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {visible.map((project, i) => (
            <motion.div
              key={project.slug}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.5, ease: EASE, delay: (i % 2) * 0.1 },
              }}
              exit={{
                opacity: 0,
                scale: 0.92,
                transition: { duration: 0.3, ease: EASE },
              }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
