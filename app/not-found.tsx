import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center px-5 py-32 text-center md:px-8 md:py-40">
      <span className="font-mono text-xs uppercase tracking-widest text-gold">
        404
      </span>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-balance">
        Page not found
      </h1>
      <p className="mt-3 text-muted-foreground">
        The page you are looking for does not exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:border-gold hover:text-gold"
      >
        Back to home
      </Link>
    </div>
  )
}
