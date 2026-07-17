'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Braces,
  Cloud,
  Container,
  Database,
  GitBranch,
  Layout,
  Server,
  TerminalSquare,
  Cpu,
  Boxes,
} from 'lucide-react'
import { Reveal } from '@/components/reveal'
import {
  reveal,
  revealLeft,
  revealRight,
  stagger,
  viewportOnce,
  EASE,
} from '@/lib/motion'

const timeline = [
  {
    year: '2023 — Present',
    role: 'Assistant Manager',
    org: 'Esso · Angus, ON',
    detail:
      'Oversee daily station operations, manage shift schedules, and supervise team members to ensure efficient fuel and convenience store service. Handle cash reconciliation, inventory ordering, and corporate compliance reporting.',
  },
  {
    year: 'May 2023 — Present',
    role: 'Assistant Store Manager',
    org: 'Burger King',
    detail:
      'Directed and supervised crew members during shifts, ensuring efficient service delivery and adherence to corporate quality and sanitation standards. Enhanced customer satisfaction ratings by effectively mediating and resolving complaints with professionalism and promptness. Managed critical financial operations, overseeing cash registers, balancing cash drawers, and ensuring accurate reporting of all shift transactions.',
  },
  {
    year: 'Sep 2022 — Jan 2026',
    role: 'Assistant Team Leader',
    org: 'Dollarama',
    detail:
      'Managed daily store operations, workflow scheduling, and delegation of tasks to ensure peak productivity and efficiency across the floor. Executed critical opening and closing procedures, including comprehensive cash reconciliation, bank deposits, and maintaining stringent store security protocols.',
  },
  {
    year: 'Feb 2024 — Nov 2024',
    role: 'Mobile Application Developer (Intern)',
    org: 'IHP (Interact Health Pro)',
    detail:
      'Executed the full mobile development lifecycle, translating complex UI/UX designs into functional, high-performance applications. Developed and optimized both front-end (React/Next.js) and robust back-end components, including API development and secure database integration (MongoDB/MySQL).',
  },
  {
    year: 'Nov 2023 — Apr 2024',
    role: 'Patient Transfer Attendant',
    org: 'Encore',
    detail:
      'Coordinated complex patient transfers between facilities, prioritizing safe, timely, and compliant transportation logistics. Maintained clear and professional communication with healthcare providers, patients, and families.',
  },
  {
    year: '',
    role: 'Mobile / Security Guard',
    org: 'G Force Security, iGuard360 & Jayo Security',
    detail:
      'Monitored and maintained secure environments for commercial establishments and banking premises through consistent patrolling and proactive risk assessment. Demonstrated strong situational awareness and problem-solving skills in high-pressure scenarios.',
  },
]

const skills = [
  { label: 'JavaScript', icon: Braces },
  { label: 'TypeScript', icon: TerminalSquare },
  { label: 'React', icon: Layout },
  { label: 'Next.js', icon: Layout },
  { label: 'Node.js', icon: Server },
  { label: 'Python', icon: TerminalSquare },
  { label: 'MongoDB', icon: Database },
  { label: 'MySQL', icon: Database },
  { label: 'Git', icon: GitBranch },
  { label: 'Leadership', icon: Cpu },
]

export function AboutContent() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-32 md:px-8 md:pt-40">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="font-display text-4xl font-bold tracking-tight text-balance md:text-6xl"
      >
        About <span className="text-gold">me</span>
      </motion.h1>

      <div className="mt-12 grid items-start gap-10 md:grid-cols-[300px_1fr]">
        <motion.div
          variants={revealLeft}
          initial="hidden"
          animate="show"
          className="relative mx-auto"
        >
          <motion.div
            aria-hidden
            animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-3 rounded-full bg-gold/25 blur-2xl"
          />
          <div className="relative aspect-square w-[240px] overflow-hidden rounded-full border-2 border-gold/40">
            <Image
              src="/portrait.jpeg"
              alt="Portrait of Sukhjot"
              fill
              sizes="240px"
              className="object-cover"
            />
          </div>
        </motion.div>

        <motion.div
          variants={revealRight}
          initial="hidden"
          animate="show"
          className="space-y-5 text-lg leading-relaxed text-muted-foreground"
        >
          <p>
            I'm Sukhjot — a full-stack developer who cares as much about the
            resilience of a distributed system as I do about the curve of a
            button on hover.
          </p>
          <p>
            My sweet spot is owning a product end-to-end: modeling the data,
            designing the APIs, wiring the infrastructure, and then sweating the
            last mile of interface polish. I believe the details are the
            product.
          </p>
          <p>
            When I'm not building, I&apos;m usually tinkering with new tech,
            mentoring fellow developers, or exploring the outdoors around Ontario.
          </p>
        </motion.div>
      </div>

      {/* Timeline */}
      <div className="mt-24">
        <Reveal>
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Experience
          </h2>
        </Reveal>

        <div className="relative mt-10 pl-8">
          <div className="absolute left-[7px] top-2 h-full w-px bg-border" />
          {timeline.map((item, i) => (
            <motion.div
              key={item.org}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.4, ease: EASE, delay: i * 0.05 }}
              className="relative pb-10 last:pb-0"
            >
              <span className="absolute -left-[27px] top-1.5 size-3.5 rounded-full border-2 border-gold bg-background" />
              <span className="font-mono text-xs uppercase tracking-widest text-gold">
                {item.year}
              </span>
              <h3 className="mt-1 font-display text-xl font-bold tracking-tight">
                {item.role}{' '}
                <span className="text-muted-foreground">· {item.org}</span>
              </h3>
              <p className="mt-1 max-w-xl leading-relaxed text-muted-foreground">
                {item.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="mt-24">
        <Reveal>
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Skills &amp; Tools
          </h2>
        </Reveal>

        <motion.ul
          variants={stagger(0.05)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5"
        >
          {skills.map(({ label, icon: Icon }) => (
            <motion.li
              key={label}
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                show: {
                  opacity: 1,
                  scale: 1,
                  transition: { duration: 0.3, ease: EASE },
                },
              }}
              whileHover={{ y: -4, scale: 1.1 }}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 transition-colors duration-200 hover:border-gold/50"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-gold transition-shadow duration-200 group-hover:shadow-[0_8px_24px_-8px_var(--gold)]">
                <Icon className="size-6" />
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {label}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </div>
  )
}
