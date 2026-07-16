'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { revealLeft, revealRight, viewportOnce } from '@/lib/motion'

export function AboutTeaser() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-24 md:grid-cols-2 md:px-8 md:py-32">
        <motion.div
          variants={revealLeft}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <span className="font-mono text-xs uppercase tracking-widest text-gold">
            About
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance md:text-4xl">
            {/* TODO: Replace with your tagline */}A developer obsessed with the space between fast and elegant.
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
            {/* TODO: Replace with your bio teaser text */}
            I build products end-to-end — owning
            architecture, infrastructure, and the last mile of polish that makes
            software feel effortless.
          </p>
          <Link
            href="/about"
            className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold"
          >
            <span className="relative">
              Learn More About Me
              <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gold transition-all duration-200 ease-out group-hover:w-full" />
            </span>
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </motion.div>

        <motion.div
          variants={revealRight}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="relative"
        >
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl border border-border">
            <Image
              src="/portrait.jpeg"
              alt="Portrait of Julian Vega"
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
          </div>
          <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-gold/10 blur-3xl" />
        </motion.div>
      </div>
    </section>
  )
}
