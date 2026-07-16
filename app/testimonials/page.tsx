import type { Metadata } from 'next'
import { PageHeading } from '@/components/page-heading'
import { TestimonialsCarousel } from '@/components/testimonials/testimonials-carousel'

export const metadata: Metadata = {
  title: 'Testimonials — Sukhjot',
  description: 'What colleagues and clients say about working with Sukhjot.',
}

export default function TestimonialsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32 text-center md:px-8 md:pt-40">
      <div className="flex flex-col items-center">
        <PageHeading
          eyebrow="Kind words"
          title="Testimonials"
          subtitle="A few words from the people I've built alongside."
        />
      </div>
      <TestimonialsCarousel />
    </div>
  )
}
