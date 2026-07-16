'use client'

import { motion } from 'framer-motion'
import { EASE } from '@/lib/motion'

export function PageHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <span className="font-mono text-xs uppercase tracking-widest text-gold">
        {eyebrow}
      </span>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-balance md:text-6xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </motion.div>
  )
}
