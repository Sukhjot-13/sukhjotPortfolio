'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { EASE } from '@/lib/motion'

const MotionLink = motion.create(Link)

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-shadow duration-200'

const variants = {
  solid:
    'bg-gold text-primary-foreground shadow-[0_0_24px_-6px_var(--gold)] hover:shadow-[0_0_40px_-4px_var(--gold)]',
  outline:
    'border border-gold/40 text-gold hover:border-gold hover:shadow-[0_0_30px_-8px_var(--gold)]',
}

const hover = { scale: 1.03, transition: { duration: 0.2, ease: EASE } }
const tap = { scale: 0.97, transition: { duration: 0.1 } }

type Props = {
  children: ReactNode
  className?: string
  variant?: keyof typeof variants
}

export function GoldButtonLink({
  href,
  children,
  className,
  variant = 'solid',
  external,
}: Props & { href: string; external?: boolean }) {
  const extra = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {}
  return (
    <MotionLink
      href={href}
      whileHover={hover}
      whileTap={tap}
      className={cn(base, variants[variant], className)}
      {...extra}
    >
      {children}
    </MotionLink>
  )
}

export function GoldButton({
  children,
  className,
  variant = 'solid',
  type = 'button',
  disabled,
  onClick,
}: Props & {
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : hover}
      whileTap={disabled ? undefined : tap}
      className={cn(
        base,
        variants[variant],
        disabled && 'cursor-not-allowed opacity-70',
        className,
      )}
    >
      {children}
    </motion.button>
  )
}
