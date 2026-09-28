'use client'

import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Projects section error:', error)
  }, [error])

  return (
    <div className="mx-auto max-w-6xl px-5 py-32 text-center md:px-8 md:py-40">
      <h1 className="font-display text-3xl font-bold tracking-tight text-balance">
        Something went wrong
      </h1>
      <p className="mt-3 text-muted-foreground">
        The projects could not be loaded right now. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:border-gold hover:text-gold"
      >
        <RefreshCw className="size-4" />
        Try again
      </button>
    </div>
  )
}
