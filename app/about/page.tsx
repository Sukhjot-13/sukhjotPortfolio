import type { Metadata } from 'next'
import { AboutContent } from '@/components/about/about-content'

export const metadata: Metadata = {
  title: 'About — Sukhjot',
  description:
    'The story, experience, and toolkit behind full-stack developer Sukhjot.',
}

export default function AboutPage() {
  return <AboutContent />
}
