import { connectDB } from './mongodb'
import { Project } from './models'
import type { ProjectData } from './types'

/**
 * Recursively strip non-plain values (MongoDB ObjectId, Date, etc.)
 * from a lean document so it's safe to pass to a Client Component.
 * Next.js rejects props whose values have toJSON() methods.
 */
function serialize<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc))
}

// ── Server-side helpers (used by server components & API routes) ──

export async function getAllProjects(tech?: string): Promise<ProjectData[]> {
  await connectDB()
  const filter = tech ? { tech } : {}
  // Newest first by creation timestamp — ensures correct ordering even
  // when multiple projects are uploaded on the same day.
  const docs = await Project.find(filter).sort({ createdAt: -1 }).lean()
  return serialize(docs) as unknown as ProjectData[]
}

export async function getProjectBySlug(
  slug: string,
): Promise<ProjectData | null> {
  await connectDB()
  const doc = await Project.findOne({ slug }).lean()
  return serialize(doc) as unknown as ProjectData | null
}

export async function getNextProject(
  slug: string,
): Promise<ProjectData | null> {
  await connectDB()
  const current = await Project.findOne({ slug }).lean()
  if (!current) return null
  // Next project is the one created just before the current one
  // (list is sorted newest-first, so "next" in detail nav = slightly older)
  const next = await Project.findOne({ createdAt: { $lt: current.createdAt } })
    .sort({ createdAt: -1 })
    .lean()
  if (next) return serialize(next) as unknown as ProjectData
  // Wrap around to the newest project
  const first = await Project.findOne().sort({ createdAt: -1 }).lean()
  return serialize(first) as unknown as ProjectData | null
}

export async function getAllTechTags(): Promise<string[]> {
  await connectDB()
  const projects = await Project.find().select('tech').lean()
  const tags = new Set<string>()
  for (const p of projects) {
    for (const t of (p as unknown as ProjectData).tech) {
      tags.add(t)
    }
  }
  return Array.from(tags).sort()
}
