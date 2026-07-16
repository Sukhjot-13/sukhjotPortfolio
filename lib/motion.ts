import type { Variants } from 'framer-motion'

// Premium ease-out-expo curve used across the whole site.
export const EASE = [0.16, 1, 0.3, 1] as const

// Default scroll reveal: fade in + slide up 20px.
export const reveal: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
}

export const revealLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } },
}

export const revealRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } },
}

// Parent container that staggers its children.
export const stagger = (staggerChildren = 0.1, delayChildren = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren, delayChildren },
  },
})

export const viewportOnce = { once: true, amount: 0.15 } as const
