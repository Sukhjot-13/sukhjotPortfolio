import Link from 'next/link'
import { GitBranch, Link2, Mail } from 'lucide-react'

const socials = [
  { href: 'https://github.com/Sukhjot-13', label: 'GitHub', icon: GitBranch },
  { href: 'https://www.linkedin.com/in/sukhjot-singh-691b99167/', label: 'LinkedIn', icon: Link2 },
  { href: 'mailto:sukhjotsingh441@gmail.com', label: 'Email', icon: Mail },
]

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 py-10 md:flex-row md:px-8">
        <div className="text-center md:text-left">
          <Link href="/" className="font-display text-lg font-bold tracking-tight">
            Sukhjot
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            Full-stack developer · Building for the web
          </p>
        </div>

        <div className="flex items-center gap-3">
          {socials.map(({ href, label, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-200 hover:border-gold hover:text-gold"
            >
              <Icon className="size-4" />
            </a>
          ))}
        </div>
      </div>
      <div className="border-t border-border py-4">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Sukhjot. Crafted with precision.
        </p>
      </div>
    </footer>
  )
}
