'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, GitBranch, Link2, Loader2, Mail, Send } from 'lucide-react'
import { GoldButton } from '@/components/gold-button'
import { EASE } from '@/lib/motion'

const fields = [
  { name: 'name', label: 'Name', type: 'text', placeholder: 'Ada Lovelace' },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'you@example.com',
  },
] as const

const socials = [
  { href: 'https://github.com', label: 'GitHub', icon: GitBranch },
  { href: 'https://linkedin.com', label: 'LinkedIn', icon: Link2 },
  { href: 'mailto:hello@sukhjot.dev', label: 'Email', icon: Mail },
]

type Status = 'idle' | 'loading' | 'success'

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status !== 'idle') return
    setStatus('loading')

    const form = e.currentTarget as HTMLFormElement
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to send')
      setStatus('success')
      form.reset()
    } catch (error) {
      console.error('Contact form error:', error)
      setStatus('idle')
      alert('Failed to send message. Please try again.')
    }
  }

  return (
    <div className="mt-12 grid gap-12 md:grid-cols-[1.4fr_1fr]">
      <motion.form
        onSubmit={handleSubmit}
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.1 } },
        }}
        className="space-y-6"
      >
        {fields.map((field) => (
          <motion.div
            key={field.name}
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.3, ease: EASE },
              },
            }}
          >
            <label
              htmlFor={field.name}
              className="mb-2 block font-mono text-xs uppercase tracking-widest text-muted-foreground"
            >
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              required
              placeholder={field.placeholder}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground/60 focus:border-gold focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--gold)_20%,transparent)]"
            />
          </motion.div>
        ))}

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 16 },
            show: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.3, ease: EASE },
            },
          }}
        >
          <label
            htmlFor="message"
            className="mb-2 block font-mono text-xs uppercase tracking-widest text-muted-foreground"
          >
            Message
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            placeholder="Tell me about your project..."
            className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground/60 focus:border-gold focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--gold)_20%,transparent)]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.4 }}
        >
          <GoldButton type="submit" disabled={status !== 'idle'}>
            {status === 'idle' && (
              <>
                Send Message
                <Send className="size-4" />
              </>
            )}
            {status === 'loading' && (
              <>
                Sending
                <Loader2 className="size-4 animate-spin" />
              </>
            )}
            {status === 'success' && (
              <>
                Message Sent
                <Check className="size-4" />
              </>
            )}
          </GoldButton>
          {status === 'success' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-sm text-gold"
            >
              Thanks — I'll get back to you within a day or two.
            </motion.p>
          )}
        </motion.div>
      </motion.form>

      <div className="space-y-6">
        <p className="text-pretty leading-relaxed text-muted-foreground">
          Prefer something more direct? Reach out on any of these and I'll
          respond as soon as I can.
        </p>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
          className="flex gap-3"
        >
          {socials.map(({ href, label, icon: Icon }) => (
            <motion.a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -4, rotate: 5 }}
              className="flex size-12 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-200 hover:border-gold hover:text-gold hover:shadow-[0_8px_24px_-8px_var(--gold)]"
            >
              <Icon className="size-5" />
            </motion.a>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
