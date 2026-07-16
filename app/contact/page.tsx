import type { Metadata } from 'next'
import { PageHeading } from '@/components/page-heading'
import { ContactForm } from '@/components/contact/contact-form'

export const metadata: Metadata = {
  title: 'Contact — Sukhjot',
  description: 'Get in touch with Sukhjot about your next project.',
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-32 md:px-8 md:pt-40">
      <PageHeading
        eyebrow="Say hello"
        title="Let's build something"
        subtitle="Have a project in mind or just want to talk shop? Drop me a line."
      />
      <ContactForm />
    </div>
  )
}
