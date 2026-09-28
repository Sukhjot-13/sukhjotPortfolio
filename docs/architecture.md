# Architecture - Portfolio Website (v0portfolio-website)

> This document describes every file in the portfolio project, its purpose, and the functions it contains.
> Last updated: 2026-09-28 (security + bug + a11y audit: removed unauthenticated PII dump and unauthenticated write routes, added contact rate limit / honeypot / length caps, real TypeScript check enabled, error boundaries, keyboard-accessible project cards, contact form a11y, moved to `docs/architecture.md` per AGENTS.md)
> Location: this file now lives in `docs/` per AGENTS.md. `README.md`-style and `AGENTS.md`-style policy docs stay at the repo root.

---

## API Surface Summary (read this first)

This is a **public static portfolio**. There is no login system, no user accounts, and no admin panel in this repo (the sibling `adminsukhjotportfolio` repo is the content-management panel).

| Route | Methods | Auth | Notes |
|---|---|---|---|
| `/api/projects` | `GET` | none (public read) | Optional `?tech=` filter. Returns base64 images replaced with API URLs. |
| `/api/projects/[slug]` | `GET` | none (public read) | Single project. 2026-09-28: a 404 now calls `logServerEvent('project_not_found')` and a 500 calls `logServerError('project_fetch_failed')` (Manager, optional). |
| `/api/projects/[slug]/image` | `GET` | none (public read) | Serves stored image bytes. |
| `/api/projects/[slug]/gallery/[index]` | `GET` | none (public read) | Serves stored gallery image bytes. |
| `/api/testimonials` | `GET` | none (public read) | Sorted by `order`. 2026-09-28: a 500 also calls `logServerError('testimonials_fetch_failed')` (Manager, optional). |
| `/api/contact` | `POST` | none (intentionally public) | Rate-limited + honeypot + length caps. Persists to Mongo, best-effort Brevo email. 2026-09-28: the 500 and the Brevo-notification failure now also call `logServerError` (Manager, optional). |
| `/api/contact/messages` | **removed 2026-09-28** | — | Was an unauthenticated full PII dump with no consumer in this repo. |

**Removed mutating handlers (2026-09-28):** `POST /api/projects`, `PUT /api/projects/[slug]`, `DELETE /api/projects/[slug]`, `POST /api/testimonials`. All four were unauthenticated content-write endpoints (including a hard delete with no confirmation, soft delete, or audit) and nothing in this repo called them. Write-path helpers (`pick`, `hasDollarKey`, `isValidExternalUrl`, `PROJECT_WRITE_FIELDS`, `TESTIMONIAL_WRITE_FIELDS`) remain in `lib/validate.ts`, are unit-tested, and are the documented contract any future gated write route must use.

**No admin token exists.** `ADMIN_API_TOKEN` was deliberately **not** added: there is no gated route left to protect, so an unused secret would be dead config. If a write route is ever reintroduced, it must read the server-side `ADMIN_API_TOKEN` env var (never a `NEXT_PUBLIC_` var) and compare it with `crypto.timingSafeEqual` on equal-length buffers.

## Project Overview

A modern Next.js v16 portfolio website for **Sukhjot**. Built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Framer Motion, and shadcn/ui. Features include: animated hero background, project showcase with filtering, testimonials carousel, contact form, and scroll-reveal animations. Uses MongoDB for dynamic data (projects, testimonials, contact messages).

---

## v0portfolio-website/ — Config & Build

### `package.json`
- **Purpose:** Project metadata, scripts, and dependency declarations.
- **Fields:**
  - `name: "my-project"`, `version: "0.1.0"`, `private: true`
  - `scripts`: `dev` (next dev), `build` (next build), `start` (next start), `lint` (eslint .), `typecheck` (tsc --noEmit, added 2026-09-28), `test` (vitest run)
- **Key Dependencies:**
  - `next` 16.2.6, `react` ^19, `react-dom` ^19
  - `framer-motion` ^12.42.2 — animations
  - `@base-ui/react` ^1.5.0 — headless UI primitives
  - `lucide-react` ^1.16.0 — icon library
  - `class-variance-authority` ^0.7.1 + `clsx` ^2.1.1 + `tailwind-merge` ^3.3.1 — class management
  - `shadcn` ^4.8.0 — shadcn/ui CLI
  - `@vercel/analytics` 1.6.1 — Vercel analytics
  - `tw-animate-css` ^1.4.0 — Tailwind animation utilities
  - `mongoose` ^9.7.4 — MongoDB ODM
- **Dev Dependencies:**
  - `tailwindcss` ^4.2.0, `@tailwindcss/postcss` ^4.2.0
  - `typescript` 5.7.3, `@types/node` ^24, `@types/react` ^19, `@types/react-dom` ^19
  - `postcss` ^8.5
  - `eslint` ^9, `eslint-config-next` 16.2.6 (added 2026-09-26 — the `lint` script was broken: binary + config missing)
  - `vitest` (added 2026-09-26 — first test runner; `npm test` runs `tests/`)
- **Overrides:** `hono` pinned to 4.12.25

### `eslint.config.mjs`
- **Purpose:** ESLint flat config (added 2026-09-26 — was missing, breaking `npm run lint`). Next core-web-vitals + TypeScript rules; ignores `.next/`, `out/`, `build/`, `next-env.d.ts`.
- **Note:** DB-served images use plain `<img>` with per-line disables (`images.unoptimized: true` makes `next/image` pointless for them).

### `next.config.mjs`
- **Purpose:** Next.js configuration.
- **Config:**
  - `typescript.ignoreBuildErrors: false` — **changed 2026-09-28** (was `true`, which masked a real `IProject.createdAt` type error and let it reach production). Type errors now fail the build.
  - `images.unoptimized: true` — disables Next.js image optimization
  - `allowedDevOrigins` — **env-driven as of 2026-09-28**. The previously hardcoded LAN IP (`192.168.2.37`) was removed; the key is only emitted when `ALLOWED_DEV_ORIGINS` is set to a non-empty comma-separated list, so no machine-specific address is committed.

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
- **Ignores:** v0 sandbox files (`__v0_*`, `.snowflake/`, `.v0-trash/`, `.vercel/`), `node_modules`, `.next/`, `.DS_Store`, `tsconfig.tsbuildinfo`
- **Env files (hardened 2026-09-28):** pattern changed from `.env*.local` to `.env*` with a `!.env.example` negation. The old pattern left `.env` and `.env.production` committable even though both are valid Next.js load targets holding `MONGODB_URI` / `BREVO_API_KEY`.

### `.env.example`
- **Purpose:** Committed template listing every env var (kept committable via the `!.env.example` negation above).
- **Content:** `MONGODB_URI`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `BREVO_TO_EMAIL`, `BREVO_TO_NAME`, `ALLOWED_DEV_ORIGINS`, plus the optional **Manager** block (`MANAGER_ENDPOINT`, `MANAGER_APP_ID`, `MANAGER_LOG_KEY`, `MANAGER_ANALYTICS_KEY`, `MANAGER_LOG_SOURCE`, and the four `NEXT_PUBLIC_MANAGER_*` values) added 2026-09-28. Every key line is blank — no credential value is ever committed. No functions.

### `next-env.d.ts`
- **Purpose:** Next.js TypeScript declarations (auto-generated).
- **Content:** References Next.js types, imports routes types.

### `AGENTS.md`
- **Purpose:** Repo-local AI agent guidelines (architecture-docs conventions, testing, permission standards). Stays at the repo root.
- **Content:** No functions — policy doc. Requires `docs/architecture.md` + env-vars section (now satisfied; this file is at `docs/architecture.md`).

### `docs/architecture.md` (this file)
- **Purpose:** Always-current file/function inventory + env vars + API surface table. Moved from the repo root to `docs/` on 2026-09-28 per AGENTS.md.
- **Content:** No functions — documentation.

### `docs/suggestions.md`
- **Purpose:** Dated log of open improvements, features, and vulnerabilities. No functions.

### `docs/to-do.md`
- **Purpose:** Dated task list / session handoff. No functions.

### `package-lock.json`
- **Purpose:** Locked dependency tree (npm). No functions.

---

## `app/` — Pages & Layout

### `app/layout.tsx`
- **Purpose:** Root layout wrapping all pages. Sets up fonts, metadata, Navbar, Footer, Vercel Analytics, and (2026-09-28) the optional `<ManagerProvider />`.
- **Functions:**
  - `RootLayout({ children })` — Wraps children with `<html>`, font class variables (`Inter` for sans, `Space_Grotesk` for display, `JetBrains_Mono` for mono), dark background, `<ManagerProvider />` (2026-09-28, renders `null`, starts the Manager browser logger + analytics tag when configured), `<Navbar>`, `<main>`, `<Footer>`, and `<Analytics />` in production
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
- **Purpose:** Projects listing page route (server component, `dynamic = 'force-dynamic'`). Fetches projects + tech tags via lib helpers, replaces base64 images with API URLs before passing to client component.
- **Functions:**
  - `ProjectsPage()` — Calls `getAllProjects()` + `getAllTechTags()`, maps `image`/`gallery` to API URLs (avoids base64 in RSC payload), renders `<PageHeading>` and `<ProjectsGallery projects={clientProjects} allTech={techTags} />`
- **Exports:**
  - `dynamic = 'force-dynamic'` — Disables static generation to avoid oversized RSC payload
  - `metadata` — Title "Projects — Sukhjot", description "A selection of full-stack projects..."

### `app/projects/[slug]/page.tsx`
- **Purpose:** Dynamic project detail page. Uses `[slug]` route segment to render a single project. Server-rendered on demand (`dynamic = 'force-dynamic'`) to avoid oversized base64 images in static HTML.
- **Functions:**
  - `generateMetadata({ params })` — Generates dynamic metadata (title = `${project.title} — Sukhjot`, description = project.blurb); returns "Project not found" if slug is invalid
  - `ProjectPage({ params })` — Awaits `params.slug`, looks up project via `getProjectBySlug()` (lib helper, not the API route), calls `notFound()` if missing, gets next project via `getNextProject()` (falls back to current project), replaces base64 images with API URLs, renders `<ProjectDetail />`
- **Exports:**
  - `dynamic = 'force-dynamic'` — Disables static generation to avoid oversized RSC payload

### `app/testimonials/page.tsx`
- **Purpose:** Testimonials page route. Sets metadata and renders heading + carousel.
- **Functions:**
  - `TestimonialsPage()` — Renders `<PageHeading>` with eyebrow "Kind words", title "Testimonials", subtitle, and `<TestimonialsCarousel />`
- **Exports:**
  - `metadata` — Title "Testimonials — Sukhjot", description "What colleagues and clients say..."

### `app/not-found.tsx` (added 2026-09-28)
- **Purpose:** App-wide 404 boundary. Previously a missing project or route produced the default Next error screen.
- **Functions:**
  - `NotFound()` — Server component rendering a "404 / Page not found" heading and a "Back to home" `<Link>`.

### `app/global-error.tsx` (added 2026-09-28)
- **Purpose:** Last-resort error boundary for root-layout-level failures (replaces its own `<html>`/`<body>`, so it uses inline styles rather than Tailwind classes).
- **Functions:**
  - `GlobalError({ error, reset })` — Logs the error in a `useEffect`, renders a minimal "Something broke" page with a `reset()` retry button. Inline styles only.

### `app/projects/error.tsx` (added 2026-09-28)
- **Purpose:** Route-segment error boundary for `/projects` and `/projects/[slug]`. Both pages are `force-dynamic` and call `connectDB()` during render, so a Mongo outage or missing `MONGODB_URI` previously hard-500'd the page with the default Next error screen.
- **Functions:**
  - `ProjectsError({ error, reset })` — Logs the error in a `useEffect`, renders a friendly heading plus a "Try again" button wired to `reset()`.

### `app/projects/loading.tsx` (added 2026-09-28)
- **Purpose:** Route-segment loading state for `/projects`, shown while the server component awaits Mongo.
- **Functions:**
  - `ProjectsLoading()` — Renders a centered gold spinner inside the page's max-width/padding shell.

---

## `app/api/` — API Routes (MongoDB)

### `app/api/projects/route.ts`
- **Purpose:** Public read-only API route for projects. Replaces base64 images with API URLs in the response.
- **Functions:**
  - `GET(request)` — Fetches all projects from MongoDB, sorted by `createdAt` descending (newest first). Applies optional `?tech=` filter. Maps base64 `image`/`gallery` to API URLs (missing gallery defaults to `[]`).
- **Removed 2026-09-28:** `POST(request)` — it passed the raw request JSON straight into `Project.create(body)` with no authentication, so any anonymous visitor could create projects and mass-assign `featured`, `order`, `_id`, `createdAt`, or top-level `$`-operators. Nothing in this repo called it. A future write route must use `pick(body, PROJECT_WRITE_FIELDS)`, force `featured`/`order` server-side, and reject `$`-prefixed keys.

### `app/api/projects/[slug]/route.ts`
- **Purpose:** Public read-only API route for a single project by slug. Replaces base64 images with API URLs in the response.
- **Functions:**
  - `GET(request, { params })` — Fetches a single project by slug, maps base64 images to API URLs (missing gallery defaults to `[]`)
- **Removed 2026-09-28:** `PUT(request, { params })` (raw body into `findOneAndUpdate({ slug }, body, ...)`, unauthenticated) and `DELETE(request, { params })` (permanent hard delete, unauthenticated, no confirmation, no soft delete, no audit trail). Neither had a consumer in this repo.

### `app/api/projects/[slug]/image/route.ts`
- **Purpose:** Serves a project's main image from MongoDB base64 data as a binary response.
- **Functions:**
  - `GET(request, { params })` — Looks up project by slug, parses base64 data URI (or raw base64), returns image with proper Content-Type and long-lived cache headers

### `app/api/projects/[slug]/gallery/[index]/route.ts`
- **Purpose:** Serves a single gallery image for a project from MongoDB base64 data as a binary response.
- **Functions:**
  - `GET(request, { params })` — Looks up project by slug and gallery index, parses base64, returns image with proper Content-Type and long-lived cache headers

### `app/api/testimonials/route.ts`
- **Purpose:** Public read-only API route for testimonials.
- **Functions:**
  - `GET()` — Fetches all testimonials from MongoDB, sorted by `order`
- **Removed 2026-09-28:** `POST(request)` — unauthenticated, passed the raw body into `Testimonial.create(body)` (mass assignment incl. `order` / `_id` / `createdAt` and `$`-operators), and had no consumer in this repo.

### `app/api/contact/route.ts`
- **Purpose:** API route for contact message submissions (POST new). Saves to MongoDB and sends Brevo email notification.
- **Functions:**
  - `sendBrevoEmail({ name, email, message })` — Sends transactional email via Brevo API with contact form details. Reads `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `BREVO_TO_EMAIL`, `BREVO_TO_NAME` from env vars. Gracefully skips if the API key is not set. HTML-escapes visitor input before interpolating into the HTML body, and strips line breaks from the email subject so the name cannot inject extra mail headers.
  - `POST(request)` — Order of operations (hardened 2026-09-28):
    1. `checkRateLimit(clientIp(request.headers))` → `429` with `Retry-After` when the per-IP budget (5/hour) is exhausted. Runs before any DB or network work.
    2. Parse JSON; `400` on malformed body.
    3. `hasDollarKey(body)` → `400` (rejects Mongo update-operator keys).
    4. `isHoneypotTripped(body)` → returns `201 { ok: true }` **without persisting or emailing**, so a bot cannot detect the trap.
    5. Validates name/message non-empty + email format → `400`; then `exceedsAnyLimit(body, CONTACT_FIELD_LIMITS)` (`name` ≤ 120, `email` ≤ 254, `message` ≤ 5000) → `400`.
    6. `connectDB()` + `ContactMessage.create({ name, email, message })` with an explicit field projection (no mass assignment).
    7. `sendBrevoEmail()` in its **own** inner `try/catch` that only logs. Previously a Brevo network failure shared the outer `try` with the persist, so an outage returned `500 "Failed to send message"` after the document was already committed — prompting a retry and duplicate rows, and hiding a real notification outage. The route now returns `201` once the document is persisted.

### `app/api/contact/messages/route.ts` — DELETED 2026-09-28
- **Purpose (former):** read contact messages. The previous architecture entry claimed it was "used by admin". That was wrong on two counts: no admin panel exists in this repo, and the route had **zero authentication**, so `curl /api/contact/messages` returned every submitted name, email, free-text message, and timestamp as full JSON.
- **Action:** route file deleted (directory removed). A repo-wide grep found zero consumers — no component, script, page, or doc reference outside the route's own error log line. Deleting the exposure is strictly better than guarding it. There is no replacement in this repo; the sibling `adminsukhjotportfolio` panel reads its own data source.

---

## `components/` — Shared Components

### `components/navbar.tsx`
- **Purpose:** Sticky navigation bar with scroll-aware backdrop blur, mobile hamburger menu, and active-route underline indicator. Brand name displays "Sukhjot" without a dot.
- **Functions:**
  - `Navbar()` — Renders a `<header>` with:
    - Scroll listener (`useEffect`) that toggles `scrolled` state at 50px threshold
    - Desktop nav links (Home, Projects, About, Testimonials, Contact) with active state via `layoutId="nav-underline"`
    - Mobile hamburger menu (`Menu`/`X` icons) with `AnimatePresence` animated dropdown
    - Auto-closes mobile menu on route change via render-phase `prevPathname` state comparison (no effect — avoids cascading re-render)
    - Helper: `isActive(href)` — returns `true` if current path matches the link's href
  - **State:** `scrolled` (boolean), `open` (boolean for mobile menu)
  - **Refs (a11y, added 2026-09-28):** `toggleRef` (the hamburger button), `panelRef` (the mobile panel)
  - **Mobile-menu keyboard behaviour (added 2026-09-28):**
    - `useEffect([open])` moves focus to the first anchor inside the panel when it opens (previously focus stayed stranded on the trigger).
    - `useEffect([open])` adds a document `keydown` listener for `Escape` that closes the menu and returns focus to the toggle button (previously the panel could not be dismissed from the keyboard).
    - Toggle button has `aria-expanded` and `aria-controls="mobile-menu"`; the panel carries `id="mobile-menu"`.

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
    - `onMove(e)` — Tracks mouse position (normalized) for parallax offset
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
    - Arrow icon, gold glow border and `inset` shadow on hover
    - Helper: `handleMove(e)` — updates motion values, `handleLeave()` — resets motion values
    - **Keyboard access rewritten 2026-09-28:** the card is no longer a `motion.div` with `onClick={() => router.push(...)}` + `cursor-pointer` (no `role`, no `tabIndex`, no `onKeyDown`, so the entire projects grid was unreachable by keyboard and invisible to screen readers — the only real anchor was `sr-only` with `tabIndex={-1}`). `useRouter` and the click handler are gone; the card content is now wrapped in a single `next/link` `<Link href={/projects/${slug}}>` with a `focus-visible` ring, and the old `sr-only` duplicate anchor was removed.
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
- **Purpose:** Full About page content — bio, portrait, timeline, and skills grid. Timeline and skills data is sourced from Sukhjot's resume. Uses HTML entities (`&apos;`, `&amp;`) for lint-clean apostrophes/ampersands.
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
- **Purpose:** Public contact form with name/email/message inputs, client-side validation, submit states, honeypot, and social links.
- **Functions:**
  - `ContactForm()` — Renders:
    - Form with animated staggered fields (Name, Email, Message/textarea), each with `maxLength` from `CONTACT_FIELD_LIMITS` and `id`/`htmlFor` label association
    - Honeypot field (added 2026-09-28): visually-hidden container (`sr-only` + `aria-hidden`) holding `<input name="website" tabIndex={-1} autoComplete="off">`. The value is submitted but never read client-side — the server silently returns `201` without doing any work.
    - `GoldButton` submit with 3 states: `idle` ("Send Message" + Send icon), `loading` ("Sending" + Loader2 spinner), `success` ("Message Sent" + Check icon + thank-you message)
    - `handleSubmit(e)` — Prevents default, runs client validation (name non-blank, email pattern, message non-blank) into per-field `errors`, then POSTs `{ name, email, message, website }` to `/api/contact` and surfaces the server's message (including the `429` copy)
  - **State:** `status` — `"idle" | "loading" | "success"`; `errors` — per-field inline messages; `formError` — form-level message. A `useEffect` resets `status` from `success` back to `idle` after 6s.
  - **A11y (2026-09-28):** the blocking `alert()` on failure is replaced by a rendered `<p role="alert">`; the success message is `<p role="status" aria-live="polite">`; per-field errors render inline under each control and are wired via `aria-invalid` / `aria-describedby`; the form has `noValidate` so this component's own validation runs; every `<label>` is associated via `id`/`htmlFor`.
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
  - **Error vs empty (2026-09-28):** the fetch now checks `r.ok`, tracks a separate `error` state, and only calls `setError(true)` on a thrown request/parse failure. Previously `.catch(console.error).finally(...)` collapsed an API `500` into the same branch as an empty collection, so visitors saw "No featured projects yet. **Add some from the admin panel.**" — copy that referenced a panel which does not exist in this repo. On error the section now renders "Couldn't load projects right now. Please try again." with a **Retry** button that bumps `attempt` and re-fetches; the genuine empty state reads "No featured projects yet. Check back soon."
  - **State:** `projects`, `loading`, `error`, `attempt` (retry counter; the effect depends on it)

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
- **Purpose:** Full project detail view — hero image, metadata, description, gallery, CTAs, and next project navigation. Both the metadata "Links" row and the CTA buttons only render when the respective link exists. Uses `<img>` tags for API-served image URLs.
- **Link guards (2026-09-28):** the metadata `Demo` / `Code` anchors were rendered unconditionally, so a project with no links produced two `href=""` anchors that reload the current page. They are now wrapped in truthiness checks matching the existing `GoldButtonLink` guards at the bottom of the component. Values are additionally constrained to `^https?://` at write time via `isValidExternalUrl` in `lib/validate.ts`.
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
- **Purpose:** Filterable project gallery with tech tag filters and animated grid. Pure presentational client component — data is passed in as props from the server page (no fetching).
- **Functions:**
  - `ProjectsGallery({ projects, allTech })` — Renders:
    - Filter buttons ("All" + `allTech` prop)
    - Filtered project grid with `AnimatePresence`, `mode="popLayout"` for animated add/remove
    - Active filter state management
    - Staggered entrance animations per column
  - **State:** `active` — current filter value (default `"All"`); `projects`/`allTech` are props (not fetched)

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
  - **State:** `index` — current testimonial index, `testimonials` (fetched data), `loading`, `error`, `attempt` (retry counter)
  - **Error vs empty (2026-09-28):** mirrors `FeaturedSection` — `r.ok` is checked and a separate `error` state is tracked, so an API `500` no longer renders as if the collection were empty. On error: "Couldn't load testimonials. Please try again." plus a **Retry** button. The old empty-state copy "No testimonials yet. Add some from the admin panel." was wrong (no admin panel exists in this repo) and is now "No testimonials have been published yet."
  - **Dot keys (2026-09-28):** indicators key on `testimonial._id` (falling back to the index) instead of the array index alone.
  - `TestimonialData` gained an optional `_id?: string` in `lib/types.ts` to support stable keys.

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

### `lib/validate.ts` (2026-09-26, extended 2026-09-28)
- **Purpose:** Shared pure input validation (unit-tested, no DB/env access). Used by the contact API route and the contact form; client mirrors the same limits.
- **Constants:**
  - `CONTACT_FIELD_LIMITS` — `{ name: 120, email: 254, message: 5000 }` hard caps enforced before `ContactMessage.create()` and mirrored as HTML `maxLength`.
  - `PROJECT_WRITE_FIELDS` — allow-list: `slug`, `title`, `blurb`, `description`, `role`, `date`, `tech`, `image`, `gallery`, `demo`, `github`.
  - `TESTIMONIAL_WRITE_FIELDS` — allow-list: `name`, `role`, `quote`, `avatar`.
- **Functions:**
  - `isNonEmptyString(value)` — Type guard for blank-free strings.
  - `isValidEmail(value)` — Type guard for well-formed email addresses.
  - `escapeHtml(value)` — Escapes `& < > " '` for HTML email interpolation.
  - `isHoneypotTripped(body)` — True only when the hidden `website` field has non-blank content.
  - `isWithinLimit(value, max)` — Length-cap type guard.
  - `exceedsAnyLimit(body, limits)` — True when any capped string field is over its limit.
  - `hasDollarKey(value)` — True when any top-level key starts with `$`; Mongoose passes these through as atomic update operators (`$unset`, `$rename`, …).
  - `pick(source, fields)` — Allow-list projection; drops everything not listed (`_id`, `createdAt`, `updatedAt`, `featured`, `order`, `$`-keys).
  - `isValidExternalUrl(value)` — True for absolute `http(s)` URLs, empty string, or `undefined`/`null`; rejects `javascript:`, protocol-relative `//host`, and relative paths.
  - `hasInvalidProjectUrl(body)` — True when either `demo` or `github` fails the above.
- **Usage note:** `pick` / `hasDollarKey` / `PROJECT_WRITE_FIELDS` / `TESTIMONIAL_WRITE_FIELDS` currently have no in-repo caller because the unauthenticated write handlers were removed on 2026-09-28. They are the documented contract for any future write route and are covered by unit tests.

### `lib/rate-limit.ts` (2026-09-28)
- **Purpose:** In-memory per-key rate limiter for the public contact form. Unit-testable — every function takes an injectable `now` and the store can be reset.
- **Exports:**
  - `RATE_LIMIT_DEFAULTS` — `{ limit: 5, windowMs: 60 * 60 * 1000 }` (5 submissions/hour per IP).
  - `checkRateLimit(key, { limit?, windowMs?, now? })` — Returns `{ allowed, remaining, retryAfterSeconds }`. Creates a fresh bucket when none exists or the previous window expired, otherwise increments the counter and denies once `count >= limit`.
  - `resetRateLimiter()` — Clears all buckets and the sweep timestamp (used by tests).
  - `clientIp(headers)` — Best-effort client IP from `x-forwarded-for` (first entry), then `x-real-ip`, then `cf-connecting-ip`, then `'unknown'` (a shared bucket for clients with no proxy headers).
  - Internal `sweep(now, windowMs)` — Periodic cleanup: evicts expired buckets, but at most once per window to avoid an O(n) sweep on every request.
- **Limitation (documented, not a defect):** process-local. A serverless cold start or a second instance gets a fresh window, so this is abuse friction, not a hard quota. A distributed deployment should back this with Redis or an equivalent shared store.

### `tests/validate.test.ts` (2026-09-26, extended 2026-09-28)
- **Purpose:** The single vitest suite for the repo, run by `npm test`. Covers `lib/validate.ts`, `lib/rate-limit.ts`, and `cn()`. 25 tests total (was 6).

### `lib/mongodb.ts`
- **Purpose:** MongoDB connection utility. Manages a cached connection to avoid multiple connections during development.
- **Functions:**
  - `connectDB()` — Returns a cached Mongoose connection. Creates a new connection if none exists, reuses existing one otherwise. Reads `MONGODB_URI` from environment variables. Logs connection status.

### `lib/models.ts`
- **Purpose:** Mongoose model definitions for all collections.
- **Exports:**
  - `IProject` (interface) / `ProjectDoc` (type) — Project document shape. **Fixed 2026-09-28:** now declares `createdAt?: Date` and `updatedAt?: Date`, which Mongoose supplies via `timestamps: true`. Their absence caused the real `lib/projects.ts` TS2339 error that `next.config.mjs` had been masking.
  - `Project` (Mongoose model) — Schema: `slug` (unique), `title`, `blurb`, `description[]`, `role`, `date`, `tech[]`, `image` (Base64 string), `gallery[]` (Base64 strings), `demo`, `github`, `featured`, `order` (for sorting); `timestamps: true`
  - `ITestimonial` (interface) / `TestimonialDoc` (type) — Testimonial document shape
  - `Testimonial` (Mongoose model) — Schema: `name`, `role`, `quote`, `avatar` (Base64 string), `order` (for sorting); `timestamps: true`
  - `IContactMessage` (interface) / `ContactMessageDoc` (type) — Contact message shape
  - `ContactMessage` (Mongoose model) — Schema: `name`, `email`, `message`, `createdAt` (auto timestamp); `timestamps: true`

### `lib/types.ts`
- **Purpose:** Shared TypeScript type definitions. No server-side imports — safe for client components.
- **Exports:**
  - `ProjectData` (interface) — Project shape: `slug`, `title`, `blurb`, `description[]`, `role`, `date`, `tech[]`, `image` (Base64), `gallery[]` (Base64), `demo`, `github`, `featured`, `order`
  - `TestimonialData` (interface) — Testimonial shape: `_id?` (added 2026-09-28 for stable carousel dot keys), `name`, `role`, `quote`, `avatar` (Base64), `order`
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

## `lib/manager/` — Manager Integration (added 2026-09-28, OPTIONAL)

Centralized logging + analytics. **Entirely optional**: with no `MANAGER_*` variables the whole
thing is a set of no-ops, so local dev, CI and previews are unaffected. This app has no logging
layer of its own, so the facade is the single entry point — the three API routes call
`logServerEvent`/`logServerError` directly, next to the `console.error` they already emitted. Full
contract in `README.md` § "Manager integration".

| File | Purpose | Exports |
|---|---|---|
| `lib/manager/logger.ts` | The vendored `@manager/logger` SDK: one file, zero dependencies, types included. Refreshed with `curl -H "x-manager-key: …" "…/api/sdk/logger?format=ts"`. Do not hand-edit. | `initLogger`, `traceIdFromHeaders`, `shutdownLoggers`, `fingerprint`, `LOG_SDK_VERSION`, `LOG_SDK_PATH`, `TRACE_HEADER` |
| `lib/manager/index.ts` | The integration facade. Reads the server `MANAGER_*` block into `managerConfig` and — separately, and this is the point — the `NEXT_PUBLIC_MANAGER_*` block into `managerClientConfig` using **static** `process.env.NEXT_PUBLIC_*` member expressions, because Next.js strips non-public env from the client bundle. Exposes a no-op logger when unconfigured, creates the real logger lazily on first use and caches it on `globalThis`, batches routine levels on a 250ms window and leading-edge-flushes `error`/`fatal`. Never throws. | `managerConfig`, `managerClientConfig`, `startManagerLogger`, `getManagerLogger`, `managerLog`, `getManagerDroppedCount`, `logServerEvent`, `logServerError`, `managerTrackerScript` |
| `lib/manager/ManagerProvider.tsx` | `'use client'` component mounted in `app/layout.tsx`. Starts the browser logger and injects the analytics `<script>` once, guarded against double injection. Gated on `managerClientConfig.enabled`, **not** `managerConfig.enabled`. | `ManagerProvider` (default) |

**Delivery profile.** Routine levels ride the SDK's own 250ms `flushIntervalMs` window, so a burst
of N lines becomes one HTTP request rather than N. `error`/`fatal` skip the window via
`scheduleUrgentFlush` (leading edge): flush now if `URGENT_FLUSH_MIN_GAP_MS` (100ms) has passed,
otherwise arm a single trailing flush — a burst of 50 errors costs ~2 requests, not 50. Measured
with `node scripts/measure-log-delivery.mjs 200`: **201/200 entries delivered, 0 dropped, 11
requests, 18.3 entries/request at 213 logs/s**. (Flushing per entry instead measures ~96/200
delivered with 105 dropped across 20 requests — one HTTP request per line.)

**Design points.**
- The logger is created on first use, not at boot: Next.js compiles startup hooks and route
  handlers into separate module graphs, so a boot-created instance is not the object a request sees.
- `captureProcessErrors` is intentionally **off** — Next.js owns process error handling, and extra
  process listeners stop log delivery entirely.
- The SDK import stays extensionless (`from './logger'`). Turbopack does not resolve an explicit
  `'./logger.js'` to `logger.ts`, so that form fails the production build here;
  `scripts/measure-log-delivery.mjs` bridges the same gap for plain Node with a
  `module.registerHooks` resolve hook.

### `scripts/` (added 2026-09-28)
| File | Purpose |
|---|---|
| `scripts/check-manager-integration.mjs` | `npm run manager:check` — live check against a running Manager: the server key, the client key and the analytics key are each accepted on the right endpoint, each wrong key kind is refused (401, generic body for an unknown key), and this app's own error paths are exercised (`GET /api/projects/<missing>` → 404 and `GET /api/testimonials` → 200). Needs `MANAGER_ENDPOINT`, `MANAGER_LOG_KEY`, `MANAGER_ANALYTICS_KEY`, `APP_ORIGIN` (default `http://localhost:3602`); `MANAGER_CLIENT_KEY` optional (its check is skipped when unset). |
| `scripts/measure-log-delivery.mjs` | `node scripts/measure-log-delivery.mjs [count]` — fires N entries at the facade the way a request handler would, counts the ingest requests that actually land, and reports latency, entries/request and SDK drops. |

### `tests/manager-integration.test.js` (added 2026-09-28)
14 vitest cases for the facade. Because the facade reads its environment at module load, every case
re-imports it after `vi.resetModules()`. Covers: disabled-when-unconfigured no-ops across every
entry point; server enablement; the analytics key alone never enabling logs; whitespace-only values
treated as unconfigured; **the server block never enabling the client half**; the client half
enabling itself from `NEXT_PUBLIC_*` alone; the tracker tag's shape; the tracker omitted without a
client analytics key; a **static-access guard** that reads `lib/manager/index.ts` and fails if any
`NEXT_PUBLIC_*` value stops being a literal `process.env.X` member expression (bracket notation
fails too) or if the client block starts indexing `process.env` dynamically; `managerLog` never
throwing at any level; info riding the 250ms window while `error` leading-edge flushes with the
100ms floor; unknown levels falling back to `info`; `getManagerDroppedCount`; `globalThis` instance
sharing; and the real SDK surface.

---

## Environment Variables

| Variable | Purpose | Referenced in |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string (required; throws if unset) | `lib/mongodb.ts` (via `connectDB()`, used by all API routes + `lib/projects.ts`) |
| `BREVO_API_KEY` | Brevo SMTP API key; if unset, email notification is skipped | `app/api/contact/route.ts` (`sendBrevoEmail`) |
| `BREVO_SENDER_EMAIL` | Sender email (default `sukhjotsingh441@gmail.com`) | `app/api/contact/route.ts` |
| `BREVO_SENDER_NAME` | Sender name (default `Portfolio Contact`) | `app/api/contact/route.ts` |
| `BREVO_TO_EMAIL` | Notification recipient (default `sukhjotsingh441@gmail.com`) | `app/api/contact/route.ts` |
| `BREVO_TO_NAME` | Recipient name (default `Sukhjot`) | `app/api/contact/route.ts` |
| `NODE_ENV` | Gates `<Analytics />` to production only | `app/layout.tsx` |
| `ALLOWED_DEV_ORIGINS` | **Added 2026-09-28.** Comma-separated extra origins Next.js may serve during dev. Replaces a hardcoded LAN IP in `next.config.mjs`. When unset, the `allowedDevOrigins` key is omitted entirely. | `next.config.mjs` |
| `MANAGER_ENDPOINT` | **Added 2026-09-28.** Base URL of the **Manager** deployment — its own port (a local Manager is `http://127.0.0.1:3300`), *not* this app's dev port. Optional; endpoint + app id + log key must all be present before the integration enables itself. | `lib/manager/index.ts` → `managerConfig` |
| `MANAGER_APP_ID` | **Added 2026-09-28.** Project slug in Manager (`sukhjotportfolio`). Optional. | `lib/manager/index.ts` → `managerConfig` |
| `MANAGER_LOG_KEY` | **Added 2026-09-28.** Project log key — `mlk_…` for the server. Optional; verified absent from the built client bundle. | `lib/manager/index.ts` → `managerConfig` |
| `MANAGER_ANALYTICS_KEY` | **Added 2026-09-28.** Analytics key (`mak_…`). Optional; without it logs still work but no analytics tag is injected. | `lib/manager/index.ts` → `managerConfig.analyticsKey` |
| `MANAGER_LOG_SOURCE` | **Added 2026-09-28.** `server` (default) or `client`. Optional. | `lib/manager/index.ts` → `SOURCE` |
| `NEXT_PUBLIC_MANAGER_ENDPOINT` | **Added 2026-09-28.** Same value as `MANAGER_ENDPOINT`. Required for *any* browser logging or analytics, because Next.js inlines only a literal `process.env.NEXT_PUBLIC_FOO` member expression — `process.env` is an empty object in browser code and a dynamic index is not inlined, so a `'use client'` module reading `MANAGER_*` is silently dead. | `lib/manager/index.ts` → `CLIENT_ENDPOINT` |
| `NEXT_PUBLIC_MANAGER_APP_ID` | **Added 2026-09-28.** Same value as `MANAGER_APP_ID`. Same inlining caveat. | `lib/manager/index.ts` → `CLIENT_APP_ID` |
| `NEXT_PUBLIC_MANAGER_CLIENT_KEY` | **Added 2026-09-28.** The project's **client** key (`mck_…`), not the server key: Manager derives each entry's `source` from the key kind. Same inlining caveat. | `lib/manager/index.ts` → `CLIENT_LOG_KEY` |
| `NEXT_PUBLIC_MANAGER_ANALYTICS_KEY` | **Added 2026-09-28.** `mak_…` analytics key. Same inlining caveat. | `lib/manager/index.ts` → `CLIENT_ANALYTICS_KEY` |

> **The Manager block is entirely optional** — all nine variables default to unset, the integration is a set of no-ops, and local dev / CI / previews are unaffected. The full annotated block lives in `.env.example`; `.env.local` carries the real values and is git-ignored.
>
> The server half and the client half are separate on purpose. Verified against the production bundle (`npm run build`): the four `NEXT_PUBLIC_*` values appear as string literals in `.next/static/chunks/`, `MANAGER_LOG_KEY` appears nowhere in `.next/static`, and the server `env()` helper survives as a dead dynamic index (`env("MANAGER_ENDPOINT")`) the browser can never resolve — harmless, because `ManagerProvider` gates on `managerClientConfig.enabled` and never reads `managerConfig`. `tests/manager-integration.test.js` reads the facade source and fails if any of the four stops being a static member expression.
>
> No `ADMIN_API_TOKEN` is defined, because no route in this repo requires authentication. The contact API is intentionally public.
>
> `.gitignore` now ignores `.env*` with a `!.env.example` negation, so all Next.js load targets (`.env`, `.env.local`, `.env.production`) stay uncommitted while the template is tracked. Template contents: see `.env.example`.

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
