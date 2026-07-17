# Architecture - Portfolio Website (v0portfolio-website)

> This document describes every file in the portfolio project, its purpose, and the functions it contains.
> Last updated: 2026-07-17 (base64 images replaced with API routes, Brevo email notifications, social links updated, about page placeholders filled)

## Project Overview

A modern Next.js v16 portfolio website for **Sukhjot**. Built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Framer Motion, and shadcn/ui. Features include: animated hero background, project showcase with filtering, testimonials carousel, contact form, and scroll-reveal animations. Uses MongoDB for dynamic data (projects, testimonials, contact messages).

---

## v0portfolio-website/ — Config & Build

### `package.json`
- **Purpose:** Project metadata, scripts, and dependency declarations.
- **Fields:**
  - `name: "my-project"`, `version: "0.1.0"`, `private: true`
  - `scripts`: `dev` (next dev), `build` (next build), `start` (next start), `lint` (eslint .)
- **Key Dependencies:**
  - `next` 16.2.6, `react` ^19, `react-dom` ^19
  - `framer-motion` ^12.42.2 — animations
  - `@base-ui/react` ^1.5.0 — headless UI primitives
  - `lucide-react` ^1.16.0 — icon library
  - `class-variance-authority` ^0.7.1 + `clsx` ^2.1.1 + `tailwind-merge` ^3.3.1 — class management
  - `shadcn` ^4.8.0 — shadcn/ui CLI
  - `@vercel/analytics` 1.6.1 — Vercel analytics
  - `tw-animate-css` ^1.4.0 — Tailwind animation utilities
  - `mongoose` ^8.x — MongoDB ODM
- **Dev Dependencies:**
  - `tailwindcss` ^4.2.0, `@tailwindcss/postcss` ^4.2.0
  - `typescript` 5.7.3, `@types/node` ^24, `@types/react` ^19, `@types/react-dom` ^19
  - `postcss` ^8.5
- **Overrides:** `hono` pinned to 4.12.25

### `next.config.mjs`
- **Purpose:** Next.js configuration.
- **Config:**
  - `typescript.ignoreBuildErrors: true` — allows build to succeed despite TS errors
  - `images.unoptimized: true` — disables Next.js image optimization

### `tsconfig.json`
- **Purpose:** TypeScript compiler configuration.
- **Key Settings:**
  - `target: "ES6"`, `jsx: "react-jsx"`
  - `strict: true`, `moduleResolution: "bundler"`
  - Path alias: `@/*` maps to `./*`
  - Includes: `next-env.d.ts`, all `.ts`/`.tsx` files, `.next/types`

### `postcss.config.mjs`
- **Purpose:** PostCSS configuration for Tailwind CSS v4.
- **Plugins:** `@tailwindcss/postcss`

### `components.json`
- **Purpose:** shadcn/ui component registry configuration.
- **Settings:**
  - `style: "base-nova"`, `rsc: true`, `tsx: true`
  - `tailwind.baseColor: "neutral"`, `cssVariables: true`
  - Aliases: `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks`
  - `iconLibrary: "lucide"`

### `.gitignore`
- **Purpose:** Git ignore rules.
- **Ignores:** v0 sandbox files (`__v0_*`, `.snowflake/`, `.v0-trash/`, `.vercel/`), `.env*.local`, `node_modules`, `.next/`, `.DS_Store`

### `next-env.d.ts`
- **Purpose:** Next.js TypeScript declarations (auto-generated).
- **Content:** References Next.js types, imports routes types.

---

## `app/` — Pages & Layout

### `app/layout.tsx`
- **Purpose:** Root layout wrapping all pages. Sets up fonts, metadata, Navbar, Footer, and Vercel Analytics.
- **Functions:**
  - `RootLayout({ children })` — Wraps children with `<html>`, font class variables (`Inter` for sans, `Space_Grotesk` for display, `JetBrains_Mono` for mono), dark background, `<Navbar>`, `<main>`, `<Footer>`, and `<Analytics />` in production
- **Exports:**
  - `metadata` — Page title "Sukhjot — Full-Stack Developer", description, `generator: "v0.app"`
  - `viewport` — `colorScheme: "dark"`, `themeColor: "#111111"`

### `app/page.tsx`
- **Purpose:** Homepage. Assembles HeroSection, FeaturedSection, and AboutTeaser.
- **Functions:**
  - `HomePage()` — Renders `<HeroSection />`, `<FeaturedSection />`, `<AboutTeaser />`

### `app/template.tsx`
- **Purpose:** Page transition template. Animates page entries with a fade+slide-up.
- **Functions:**
  - `Template({ children })` — Wraps children in a `motion.div` with `opacity: 0 → 1` and `y: 10 → 0` transition using `EASE` curve

### `app/globals.css`
- **Purpose:** Global CSS — Tailwind v4 imports, CSS custom properties (design tokens), base styles, and utility classes.
- **Key Definitions:**
  - Imports `tailwindcss`, `tw-animate-css`, `shadcn/tailwind.css`
  - `@theme inline` block — maps CSS variables to Tailwind theme colors, font families, radius scales
  - `:root` block — full dark-mode color palette with gold accent (`oklch(0.79 0.128 87)`) and neutral background/foreground
  - `@layer base` — border and scroll-behavior reset
  - `@layer utilities` — `.text-gold`, `.bg-gold`, `.border-gold`, `.glow-gold` utility classes

### `app/about/page.tsx`
- **Purpose:** About page route. Sets metadata and renders AboutContent.
- **Functions:**
  - `AboutPage()` — Renders `<AboutContent />`
- **Exports:**
  - `metadata` — Title "About — Sukhjot", description about story/experience/toolkit

### `app/contact/page.tsx`
- **Purpose:** Contact page route. Sets metadata and renders heading + contact form.
- **Functions:**
  - `ContactPage()` — Renders `<PageHeading>` with eyebrow "Say hello", title "Let's build something", subtitle, and `<ContactForm />`
- **Exports:**
  - `metadata` — Title "Contact — Sukhjot", description "Get in touch..."

### `app/projects/page.tsx`
- **Purpose:** Projects listing page route. Sets metadata and renders heading + gallery. Replaces base64 images with API URLs before passing to client component.
- **Functions:**
  - `ProjectsPage()` — Fetches all projects, maps `image`/`gallery` to API URLs (avoids base64 in RSC payload), renders `<PageHeading>` and `<ProjectsGallery />`
- **Exports:**
  - `metadata` — Title "Projects — Sukhjot", description "A selection of full-stack projects..."

### `app/projects/[slug]/page.tsx`
- **Purpose:** Dynamic project detail page. Uses `[slug]` route segment to render a single project. Server-rendered on demand (`dynamic = 'force-dynamic'`) to avoid oversized base64 images in static HTML.
- **Functions:**
  - `generateMetadata({ params })` — Generates dynamic metadata (title = `${project.title} — Sukhjot`, description = project.blurb); returns "Project not found" if slug is invalid
  - `ProjectPage({ params })` — Awaits `params.slug`, looks up project via API, calls `notFound()` if missing, gets next project, replaces base64 images with API URLs, renders `<ProjectDetail />`
- **Exports:**
  - `dynamic = 'force-dynamic'` — Disables static generation to avoid oversized RSC payload

### `app/testimonials/page.tsx`
- **Purpose:** Testimonials page route. Sets metadata and renders heading + carousel.
- **Functions:**
  - `TestimonialsPage()` — Renders `<PageHeading>` with eyebrow "Kind words", title "Testimonials", subtitle, and `<TestimonialsCarousel />`
- **Exports:**
  - `metadata` — Title "Testimonials — Sukhjot", description "What colleagues and clients say..."

---

## `app/api/` — API Routes (MongoDB)

### `app/api/projects/route.ts`
- **Purpose:** API route for projects (GET all, POST new). Replaces base64 images with API URLs in response.
- **Functions:**
  - `GET()` — Fetches all projects from MongoDB, returns sorted by `createdAt` descending (newest first). Applies optional `?tech=` filter. Maps base64 `image`/`gallery` to API URLs.
  - `POST(request)` — Creates a new project from JSON body, saves to MongoDB, returns created project.

### `app/api/projects/[slug]/route.ts`
- **Purpose:** API route for single project operations (GET, PUT, DELETE by slug). Replaces base64 images with API URLs in response.
- **Functions:**
  - `GET(request, { params })` — Fetches a single project by slug, maps base64 images to API URLs
  - `PUT(request, { params })` — Updates a project by slug with partial body
  - `DELETE(request, { params })` — Deletes a project by slug

### `app/api/projects/[slug]/image/route.ts`
- **Purpose:** Serves a project's main image from MongoDB base64 data as a binary response.
- **Functions:**
  - `GET(request, { params })` — Looks up project by slug, parses base64 data URI (or raw base64), returns image with proper Content-Type and long-lived cache headers

### `app/api/projects/[slug]/gallery/[index]/route.ts`
- **Purpose:** Serves a single gallery image for a project from MongoDB base64 data as a binary response.
- **Functions:**
  - `GET(request, { params })` — Looks up project by slug and gallery index, parses base64, returns image with proper Content-Type and long-lived cache headers

### `app/api/testimonials/route.ts`
- **Purpose:** API route for testimonials (GET all, POST new).
- **Functions:**
  - `GET()` — Fetches all testimonials from MongoDB, sorted by order field
  - `POST(request)` — Creates a new testimonial from JSON body

### `app/api/contact/route.ts`
- **Purpose:** API route for contact message submissions (POST new). Saves to MongoDB and sends Brevo email notification.
- **Functions:**
  - `sendBrevoEmail({ name, email, message })` — Sends transactional email via Brevo API with contact form details. Reads `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `BREVO_TO_EMAIL`, `BREVO_TO_NAME` from env vars. Gracefully skips if API key is not set.
  - `POST(request)` — Validates name/email/message, saves to MongoDB, fires `sendBrevoEmail()` (fire-and-forget, doesn't block response)

### `app/api/contact/messages/route.ts`
- **Purpose:** API route to read contact messages (used by admin).
- **Functions:**
  - `GET()` — Fetches all contact messages from MongoDB, sorted by newest first

---

## `components/` — Shared Components

### `components/navbar.tsx`
- **Purpose:** Sticky navigation bar with scroll-aware backdrop blur, mobile hamburger menu, and active-route underline indicator. Brand name displays "Sukhjot" without a dot.
- **Functions:**
  - `Navbar()` — Renders a `<header>` with:
    - Scroll listener (`useEffect`) that toggles `scrolled` state at 50px threshold
    - Desktop nav links (Home, Projects, About, Testimonials, Contact) with active state via `layoutId="nav-underline"`
    - Mobile hamburger menu (`Menu`/`X` icons) with `AnimatePresence` animated dropdown
    - Auto-closes mobile menu on route change (`useEffect` watching `pathname`)
    - Helper: `isActive(href)` — returns `true` if current path matches the link's href
  - **State:** `scrolled` (boolean), `open` (boolean for mobile menu)

### `components/footer.tsx`
- **Purpose:** Site footer with branding, tagline, and social links. Brand name displays "Sukhjot" without a dot.
- **Functions:**
  - `Footer()` — Renders:
    - Brand link "Sukhjot"
    - Tagline "Full-stack developer · Building for the web"
    - Social links (GitHub: Sukhjot-13, LinkedIn: sukhjot-singh-691b99167, Email: sukhjotsingh441@gmail.com) as icon buttons
    - Copyright line with current year

### `components/gold-button.tsx`
- **Purpose:** Reusable gold-accented buttons and link-buttons with hover/tap animations.
- **Functions:**
  - `GoldButtonLink({ href, children, className, variant, external })` — Animated `Link` component using `MotionLink` with `whileHover`, `whileTap`, optional `target="_blank"` for external links
  - `GoldButton({ children, className, variant, type, disabled, onClick })` — Animated `<motion.button>` with hover/tap animations, disabled state with `cursor-not-allowed`
- **Variants:** `solid` (filled gold with glow shadow), `outline` (border-only gold)
- **Shared Base:** `base` constant with rounded-full, padding, font-semibold, tracking styles

### `components/hero-background.tsx`
- **Purpose:** Animated particle network canvas for the hero section. Renders floating nodes connected by lines, with mouse parallax.
- **Functions:**
  - `HeroBackground()` — Sets up a `<canvas>` with:
    - Particle nodes (up to 70, density-based) with random positions and velocities
    - Particle-to-particle lines drawn when distance < 130px with opacity fade
    - Mouse parallax effect offsetting nodes by cursor position
    - `resize()` — Recalculates dimensions and node count on window resize
    - `draw()` — Animation loop: clears canvas, updates positions, bounces off edges, draws lines and dots
    - Radial gradient overlay and glow blur backdrop
    - **Internal Types:** `Node` — `{ x, y, vx, vy }`
  - **State:** `canvasRef`, `wrapRef`, `mouse` (useRef)

### `components/page-heading.tsx`
- **Purpose:** Animated page heading with eyebrow, title, and optional subtitle.
- **Functions:**
  - `PageHeading({ eyebrow, title, subtitle })` — Renders a `motion.div` with fade+slide-up animation, monospace gold eyebrow, display-font title, and muted subtitle line

### `components/project-card.tsx`
- **Purpose:** Interactive project card with 3D tilt effect on hover, and a larger featured card variant. Uses `<img>` tags (not `next/image`) for API-served image URLs.
- **Functions:**
  - `ProjectCard({ project })` — Renders a card with:
    - 3D tilt via `useMotionValue`/`useSpring`/`useTransform` (rotateX/rotateY based on mouse position within card)
    - Image (API-served URL), title, blurb, tech tags
    - Arrow icon, navigation to `/projects/${slug}` on click
    - Gold glow border and `inset` shadow on hover
    - Helper: `handleMove(e)` — updates motion values, `handleLeave()` — resets motion values
  - `FeaturedCard({ project })` — Renders a larger side-by-side card for featured projects:
    - Image on left, content on right (desktop) / stacked (mobile)
    - Featured label with date, title, blurb, tech tags, "View project" link
    - Gold inset glow on hover

### `components/reveal.tsx`
- **Purpose:** Scroll-reveal wrapper component using Framer Motion `whileInView`.
- **Functions:**
  - `Reveal({ children, variants, className, delay, as })` — Wraps children in a `motion[as]` element with `initial="hidden"`, `whileInView="show"`, `viewport={viewportOnce}`, optional delay
  - **Props:** `as` accepts `"div"` | `"section"` | `"li"` | `"span"` (default `"div"`)

### `components/ui/button.tsx`
- **Purpose:** shadcn/ui styled button component using `@base-ui/react/button` primitive.
- **Functions:**
  - `Button({ className, variant, size, ...props })` — Renders a `ButtonPrimitive` with `data-slot="button"` and computed className from `buttonVariants`
- **Exports:** `Button`, `buttonVariants` (cva config)
- **Variants:** `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`
- **Sizes:** `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`

---

## `components/about/` — About Feature

### `components/about/about-content.tsx`
- **Purpose:** Full About page content — bio, portrait, timeline, and skills grid. Timeline and skills data is sourced from Sukhjot's resume.
- **Functions:**
  - `AboutContent()` — Renders:
    - Animated heading "About me" with gold accent
    - Portrait image with glow animation (`opacity` + `scale` pulsing)
    - Bio section (3 paragraphs — personal introduction) with reveal animation
    - **Timeline section:** 6 experience entries with vertical timeline, animated dots, and sequential scroll-reveal:
      1. Assistant Manager, Esso · Angus, ON (2023 — Present)
      2. Assistant Store Manager, Burger King (May 2023 — Present)
      3. Assistant Team Leader, Dollarama (Sep 2022 — Jan 2026)
      4. Mobile Application Developer (Intern), IHP (Feb 2024 — Nov 2024)
      5. Patient Transfer Attendant, Encore (Nov 2023 — Apr 2024)
      6. Mobile / Security Guard, G Force Security, iGuard360 & Jayo Security
    - **Skills section:** 10 skills (JavaScript, TypeScript, React, Next.js, Node.js, Python, MongoDB, MySQL, Git, Leadership) as cards with icons, staggered grid reveal, and hover lift effect
  - **Data:** `timeline[]`, `skills[]` with lucide icons

---

## `components/contact/` — Contact Feature

### `components/contact/contact-form.tsx`
- **Purpose:** Contact form with name/email/message inputs, submit states, and social links.
- **Functions:**
  - `ContactForm()` — Renders:
    - Form with animated staggered fields (Name, Email, Message/textarea)
    - `GoldButton` submit with 3 states: `idle` ("Send Message" + Send icon), `loading` ("Sending" + Loader2 spinner), `success` ("Message Sent" + Check icon + thank-you message)
    - `handleSubmit(e)` — Prevents default, POSTs form data to `/api/contact`, handles loading/success states
  - **State:** `status` — `"idle" | "loading" | "success"`
  - **Data:** `fields[]` (name, email), `socials[]` (GitHub: Sukhjot-13, LinkedIn: sukhjot-singh-691b99167, Email: sukhjotsingh441@gmail.com) — sidebar with animated links

---

## `components/home/` — Home Page Sections

### `components/home/hero-section.tsx`
- **Purpose:** Full-screen hero section with particle background, animated headline, subtitle, CTA button, and scroll-down indicator.
- **Functions:**
  - `HeroSection()` — Renders:
    - `<HeroBackground />` animated background
    - Staggered headline: "Full-Stack Developer" (eyebrow), "Sukhjot" builds for the web" (two-line heading)
    - Descriptive subtitle paragraph
    - `GoldButtonLink` CTA → "/projects"
    - Animated `ChevronDown` scroll indicator at bottom
  - **Animation:** `lineVariants` with staggered custom delay per child element

### `components/home/featured-section.tsx`
- **Purpose:** Featured projects section on the homepage. Fetches projects from MongoDB API.
- **Functions:**
  - `FeaturedSection()` — Fetches projects from `/api/projects`, renders:
    - Eyebrow "Selected work", heading "Featured Work"
    - Up to 2 featured projects (filtered by `project.featured`) rendered as `FeaturedCard`
    - "See All Projects" outline button → "/projects"
    - Staggered scroll-reveal for project list (loading state while fetching)

### `components/home/about-teaser.tsx`
- **Purpose:** About teaser section on the homepage — portrait + CTA to about page.
- **Functions:**
  - `AboutTeaser()` — Renders:
    - Left column: eyebrow "About", tagline "A developer obsessed with the space between fast and elegant.", descriptive paragraph, "Learn More About Me" link with animated underline
    - Right column: Portrait image with gradient overlay in a rounded container with glow backdrop
    - Scroll-reveal from left/right directions

---

## `components/projects/` — Project Features

### `components/projects/project-detail.tsx`
- **Purpose:** Full project detail view — hero image, metadata, description, gallery, CTAs, and next project navigation. Demo/Code buttons only render when the respective link exists (project.demo / project.github is non-empty). Uses `<img>` tags for API-served image URLs.
- **Functions:**
  - `ProjectDetail({ project, next })` — Renders:
    - "Back to Projects" link with arrow
    - Large hero image with scale-in animation (API-served image URL)
    - Project title, metadata grid (Role, Year, Links/Demo/Code)
    - Tech stack tags with staggered reveal
    - Description paragraphs (from `project.description` array)
    - Gallery images in a 2-column grid
    - "Live Demo" (solid) and "View Code" (outline) `GoldButtonLink` CTAs
    - "Next Project" section — link to next project card with hover effects

### `components/projects/projects-gallery.tsx`
- **Purpose:** Filterable project gallery with tech tag filters and animated grid. Fetches from MongoDB API.
- **Functions:**
  - `ProjectsGallery()` — Fetches from `/api/projects`, renders:
    - Filter buttons ("All" + all unique tech tags extracted from fetched projects)
    - Filtered project grid with `AnimatePresence`, `mode="popLayout"` for animated add/remove
    - Active filter state management
    - Staggered entrance animations per column
    - Loading state while fetching
  - **State:** `active` — current filter value (default `"All"`), `projects` (fetched data), `loading`

---

## `components/testimonials/` — Testimonials Feature

### `components/testimonials/testimonials-carousel.tsx`
- **Purpose:** Auto-rotating testimonials carousel with manual controls and dot indicators. Fetches from MongoDB API.
- **Functions:**
  - `TestimonialsCarousel()` — Fetches from `/api/testimonials`, renders:
    - Quote icon, animated testimonial block (quote text, avatar, name, role)
    - Previous/Next buttons with chevron icons
    - Dot indicators (active dot wider with gold, others small)
    - Auto-rotation every 5 seconds via `setInterval`
    - Helper: `go(dir)` — moves index forward/backward wrapping around
    - Loading state while fetching
  - **State:** `index` — current testimonial index, `testimonials` (fetched data), `loading`

---

## `lib/` — Utilities & Data

### `lib/motion.ts`
- **Purpose:** Centralized Framer Motion animation constants and variant definitions.
- **Exports:**
  - `EASE` — `[0.16, 1, 0.3, 1]` (premium ease-out-expo curve, used across the entire site)
  - `reveal` — Default scroll-reveal variant (opacity 0→1, y: 20→0, 0.5s)
  - `revealLeft` — Scroll-reveal from left (x: -30→0)
  - `revealRight` — Scroll-reveal from right (x: 30→0)
  - `stagger(staggerChildren, delayChildren)` — Factory function returning a parent container variant that staggers its children
  - `viewportOnce` — `{ once: true, amount: 0.15 }` (trigger when 15% visible, only once)

### `lib/utils.ts`
- **Purpose:** General utility functions.
- **Functions:**
  - `cn(...inputs)` — Merges Tailwind class names using `clsx` + `tailwind-merge`. Takes variadic `ClassValue[]`, returns a deduplicated/merged string

### `lib/mongodb.ts`
- **Purpose:** MongoDB connection utility. Manages a cached connection to avoid multiple connections during development.
- **Functions:**
  - `connectDB()` — Returns a cached Mongoose connection. Creates a new connection if none exists, reuses existing one otherwise. Reads `MONGODB_URI` from environment variables. Logs connection status.

### `lib/models.ts`
- **Purpose:** Mongoose model definitions for all collections.
- **Exports:**
  - `Project` (Mongoose model) — Schema: `slug` (unique), `title`, `blurb`, `description[]`, `role`, `date`, `tech[]`, `image` (Base64 string), `gallery[]` (Base64 strings), `demo`, `github`, `featured`, `order` (for sorting)
  - `Testimonial` (Mongoose model) — Schema: `name`, `role`, `quote`, `avatar` (Base64 string), `order` (for sorting)
  - `ContactMessage` (Mongoose model) — Schema: `name`, `email`, `message`, `createdAt` (auto timestamp)

### `lib/types.ts`
- **Purpose:** Shared TypeScript type definitions. No server-side imports — safe for client components.
- **Exports:**
  - `ProjectData` (interface) — Project shape: `slug`, `title`, `blurb`, `description[]`, `role`, `date`, `tech[]`, `image` (Base64), `gallery[]` (Base64), `demo`, `github`, `featured`, `order`
  - `TestimonialData` (interface) — Testimonial shape: `name`, `role`, `quote`, `avatar` (Base64), `order`
  - `ContactMessageData` (interface) — Message shape: `_id`, `name`, `email`, `message`, `createdAt`

### `lib/projects.ts`
- **Purpose:** Server-side helpers for fetching projects from MongoDB. Used by server components and API routes.
- **Helper:**
  - `serialize<T>(doc)` — Recursively strips non-plain values (MongoDB ObjectId, Date, etc.) from a lean document using `JSON.parse(JSON.stringify())`. Required because Next.js rejects props with `toJSON()` methods when passing from Server Components to Client Components.
- **Functions:**
  - `getAllProjects(tech?)` — Fetches all projects from MongoDB, optionally filtered by tech tag, sorted by `createdAt` descending (newest first). Handles same-day uploads correctly via full timestamp. Result is serialized for safe Client Component usage.
  - `getProjectBySlug(slug)` — Fetches a single project by slug. Result is serialized.
  - `getNextProject(slug)` — Fetches the next project based on `createdAt` (older project, wraps around to newest). Result is serialized.
  - `getAllTechTags()` — Returns sorted array of unique tech tags across all projects

---

## `public/` — Static Assets

### Images
| File | Description |
|---|---|
| `portrait.jpeg` | Main portrait photo (TODO: replace with Sukhjot's photo) |
| `placeholder-logo.png` | Placeholder logo |
| `placeholder-logo.svg` | Placeholder logo (vector) |
| `placeholder-user.jpg` | Placeholder user image |
| `placeholder.jpg` | General placeholder image |
| `placeholder.svg` | General placeholder (vector) |

### Icons
| File | Description |
|---|---|
| `icon.svg` | Favicon (vector) |
| `icon-dark-32x32.png` | Dark mode favicon 32×32 |
| `icon-light-32x32.png` | Light mode favicon 32×32 |
| `apple-icon.png` | Apple touch icon |

### Removed files
The following were deleted because their data is now served from MongoDB with Base64-encoded images:
- `avatars/` (amara.png, daniel.png, sofia.png)
- `projects/` (all old placeholder project images)
