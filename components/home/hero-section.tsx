'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { HeroBackground } from '@/components/hero-background'
import { GoldButtonLink } from '@/components/gold-button'
import { EASE } from '@/lib/motion'

const lineVariants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE, delay: i * 0.15 },
  }),
}

const roles = [
  'Full-Stack Developer',
  'React & Node Engineer',
  'UI/UX-Minded Builder',
]

export function HeroSection() {
  const [roleIndex, setRoleIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setRoleIndex((i) => (i + 1) % roles.length)
    }, 2800)
    return () => clearInterval(id)
  }, [])

  // subtle mouse-reactive parallax on the text block
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 })
  const translateX = useTransform(springX, [-0.5, 0.5], [-10, 10])
  const translateY = useTransform(springY, [-0.5, 0.5], [-8, 8])

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5)
      mouseY.set(e.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [mouseX, mouseY])

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <HeroBackground />

      {/* soft gold glow anchor behind headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-[120px]"
      />

      <motion.div
        style={{ x: translateX, y: translateY }}
        className="relative z-10 mx-auto max-w-3xl px-5 text-center"
      >
        <motion.div
          custom={0}
          variants={lineVariants}
          initial="hidden"
          animate="show"
          className="relative h-6 font-mono text-sm uppercase tracking-[0.3em] text-gold"
        >
          <motion.span
            key={roleIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {roles[roleIndex]}
          </motion.span>
        </motion.div>

        <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl md:text-7xl">
          <motion.span
            custom={1}
            variants={lineVariants}
            initial="hidden"
            animate="show"
            className="relative inline-block"
          >
            Sukhjot
            {/* signature underline draws itself after the name appears */}
            <motion.svg
              aria-hidden
              viewBox="0 0 220 12"
              className="absolute -bottom-2 left-0 h-3 w-full"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.9 }}
            >
              <motion.path
                d="M2 8 C 40 2, 80 10, 120 6 S 200 2, 218 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-gold"
              />
            </motion.svg>
          </motion.span>
          <motion.span
            custom={2}
            variants={lineVariants}
            initial="hidden"
            animate="show"
            className="block text-muted-foreground"
          >
            builds for the web
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.3 }}
          className="mx-auto mt-6 max-w-xl text-pretty leading-relaxed text-muted-foreground"
        >
          I design and engineer fast, resilient systems — from distributed
          backends to pixel-precise interfaces — for teams that care about the
          details.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.5 }}
          className="mt-10 flex justify-center"
        >
          <GoldButtonLink href="/projects">View All Projects</GoldButtonLink>
        </motion.div>
      </motion.div>

      <motion.div
        aria-hidden
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 rounded-full border border-gold/30 p-2 text-gold"
      >
        <ChevronDown className="size-6" />
      </motion.div>
    </section>
  )
}