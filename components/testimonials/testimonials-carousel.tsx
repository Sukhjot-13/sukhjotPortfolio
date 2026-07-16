'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { TestimonialData } from '@/lib/types'

export function TestimonialsCarousel() {
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([])
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(0)
  const count = testimonials.length

  useEffect(() => {
    fetch('/api/testimonials')
      .then((r) => r.json())
      .then((data: TestimonialData[]) => {
        setTestimonials(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + count) % count),
    [count],
  )

  useEffect(() => {
    if (count === 0) return
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 5000)
    return () => clearInterval(id)
  }, [count])

  if (loading) {
    return (
      <div className="mt-14 flex items-center justify-center py-20">
        <div className="size-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    )
  }

  if (count === 0) {
    return (
      <div className="mt-14 text-center text-muted-foreground">
        No testimonials yet. Add some from the admin panel.
      </div>
    )
  }

  const active = testimonials[index]

  return (
    <div className="mt-14">
      <div className="relative mx-auto max-w-3xl">
        <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-border bg-card p-8 md:p-12">
          <Quote className="size-10 text-gold/40" />
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={index}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="mt-4"
            >
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
                className="text-pretty text-xl leading-relaxed md:text-2xl"
              >
                {active.quote}
              </motion.p>
              <motion.footer
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="mt-8 flex items-center gap-4"
              >
                <div className="relative size-12 overflow-hidden rounded-full border border-gold/40">
                  {active.avatar ? (
                    <Image
                      src={active.avatar}
                      alt={active.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-secondary text-xs text-muted-foreground">
                      ?
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-display font-bold tracking-tight">
                    {active.name}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {active.role}
                  </div>
                </div>
              </motion.footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous testimonial"
            className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-gold hover:text-gold"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="flex items-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                className={cn(
                  'h-2 rounded-full transition-all duration-[250ms] ease-out',
                  i === index ? 'w-8 bg-gold' : 'w-2 bg-border hover:bg-gold/50',
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next testimonial"
            className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-gold hover:text-gold"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
