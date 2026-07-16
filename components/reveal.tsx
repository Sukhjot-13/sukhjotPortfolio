'use client'

import { motion, type Variants } from 'framer-motion'
import { reveal, viewportOnce } from '@/lib/motion'
import type { ReactNode } from 'react'

export function Reveal({
  children,
  variants = reveal,
  className,
  delay = 0,
  as = 'div',
}: {
  children: ReactNode
  variants?: Variants
  className?: string
  delay?: number
  as?: 'div' | 'section' | 'li' | 'span'
}) {
  const MotionTag = motion[as]
  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      transition={delay ? { delay } : undefined}
    >
      {children}
    </MotionTag>
  )
}
