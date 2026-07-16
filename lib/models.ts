import mongoose, { Schema, type Document } from 'mongoose'

// ── Project ──
export interface IProject {
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

export type ProjectDoc = IProject & Document

const ProjectSchema = new Schema<IProject>(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    blurb: { type: String, required: true },
    description: [{ type: String }],
    role: { type: String, default: '' },
    date: { type: String, default: '' },
    tech: [{ type: String }],
    image: { type: String, default: '' },
    gallery: [{ type: String }],
    demo: { type: String, default: '' },
    github: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export const Project =
  (mongoose.models.Project as mongoose.Model<IProject>) ||
  mongoose.model<IProject>('Project', ProjectSchema)

// ── Testimonial ──
export interface ITestimonial {
  name: string
  role: string
  quote: string
  /** Base64-encoded avatar image */
  avatar: string
  order: number
}

export type TestimonialDoc = ITestimonial & Document

const TestimonialSchema = new Schema<ITestimonial>(
  {
    name: { type: String, required: true },
    role: { type: String, default: '' },
    quote: { type: String, required: true },
    avatar: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export const Testimonial =
  (mongoose.models.Testimonial as mongoose.Model<ITestimonial>) ||
  mongoose.model<ITestimonial>('Testimonial', TestimonialSchema)

// ── Contact Message ──
export interface IContactMessage {
  name: string
  email: string
  message: string
  createdAt: Date
}

export type ContactMessageDoc = IContactMessage & Document

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true },
)

export const ContactMessage =
  (mongoose.models.ContactMessage as mongoose.Model<IContactMessage>) ||
  mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema)
