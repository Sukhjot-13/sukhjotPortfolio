import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
vi.mock('next/navigation', () => ({ notFound:() => { throw new Error('NEXT_NOT_FOUND') } }))
import TestimonialsPage from '../app/testimonials/page.tsx'
describe('temporarily unpublished testimonials', () => {
  it('rejects direct page visits before rendering or mounting the carousel', () => {
    expect(() => TestimonialsPage()).toThrow('NEXT_NOT_FOUND')
    expect(readFileSync('app/testimonials/page.tsx','utf8')).not.toContain('TestimonialsCarousel')
  })
  it('removes the shared desktop/mobile navigation link and stays absent on the homepage', () => {
    expect(readFileSync('components/navbar.tsx','utf8')).not.toContain('/testimonials')
    expect(readFileSync('app/page.tsx','utf8').toLowerCase()).not.toContain('testimonial')
  })
})
