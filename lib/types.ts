// Shared type definitions — no server-side imports, safe for client components

export interface ProjectData {
  slug: string
  title: string
  blurb: string
  description: string[]
  role: string
  date: string
  tech: string[]
  /** Base64-encoded image data URI */
  image: string
  /** Array of Base64-encoded gallery images */
  gallery: string[]
  demo: string
  github: string
  featured: boolean
  order: number
}

export interface TestimonialData {
  name: string
  role: string
  quote: string
  /** Base64-encoded avatar image */
  avatar: string
  order: number
}

export interface ContactMessageData {
  _id: string
  name: string
  email: string
  message: string
  createdAt: string
}
