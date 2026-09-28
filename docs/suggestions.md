# Suggestions

> 2026-09-26: first suggestions file for this repo (previously none existed).
> Convention: only open items live here; fixed items move to `architecture.md` history.

## 🟢 Improvements

- (2026-09-26) Test coverage is thin: `tests/validate.test.ts` covers only pure helpers (`lib/validate.ts`, `cn`). API routes need DB-backed tests (e.g. gallery-`[]` fallback, contact validation) once a test database is available.
- (2026-09-28) Test coverage improved from 6 to 25 unit tests: rate limiter (limit exceeded, per-key isolation, window reset, sweep eviction, custom limit/window), honeypot detection, field-length caps, `$`-operator body rejection, allow-list projection, and project URL validation. Still pure-function only — the route handlers themselves are untested.
- (2026-09-28) `tests/validate.test.ts` has grown past the point where one file is easy to navigate. Consider splitting into `tests/validate.test.ts`, `tests/rate-limit.test.ts`, and a future `tests/api.test.ts` once DB-backed tests land.
- (2026-09-28) The contact form resets to `idle` 6s after success via a `useEffect` timer. A dedicated "Send another" affordance would be clearer than a silent auto-reset, and would remove the timer entirely.
- (2026-09-28) The projects grid cards are now real links, but the 3D tilt still tracks `onMouseMove` on the whole card. Consider `prefers-reduced-motion` handling so the tilt is disabled for users who request reduced motion (the site has no such check today).
- (2026-09-28) `lib/rate-limit.ts` is process-local, so serverless cold starts and multiple instances each get a fresh window. A shared store (Redis/Upstash) would make the 5/hour budget enforceable across instances.
- (2026-09-28) `app/projects/error.tsx` covers `/projects` and `/projects/[slug]`, but a Mongo outage also hard-500s `app/page.tsx` (via `FeaturedSection`'s client fetch — now handled with a retry) and any other future segment that calls `connectDB()`. Consider a shared error-boundary component reused per segment rather than a new file per route.

## 🟡 New Features

_(none open)_

## 🔴 Vulnerabilities

_(none open — all 2026-09-28 audit findings were fixed in the same pass; see `docs/architecture.md` for the resulting design)_

- (2026-09-28) **FIXED — unauthenticated PII dump.** `GET /api/contact/messages` had zero authentication and returned every contact submission (name, email, message, timestamps) as JSON. A repo-wide grep found no consumer, so the route file was deleted rather than guarded.
- (2026-09-28) **FIXED — unauthenticated content write + mass assignment.** `POST /api/projects`, `PUT`/`DELETE /api/projects/[slug]`, and `POST /api/testimonials` accepted anonymous writes, passed raw request JSON into Mongoose (allowing `featured`, `order`, `_id`, `createdAt` and top-level `$`-operators such as `$unset`/`$rename`), and offered a permanent unconfirmed hard delete. No consumer existed in this repo, so the mutating handlers were deleted. The allow-list/URL validators remain in `lib/validate.ts`, unit-tested, as the contract for any future gated write route.
- (2026-09-28) **FIXED — contact form abuse as a spam relay.** No rate limit, no CAPTCHA, no honeypot, and no field length caps meant the site could be flooded and used to mail-bomb the owner's inbox while burning the Brevo quota. Added a 5/hour per-IP limiter (429), a silent honeypot (`201` with no work done), and hard server-side caps (name 120, email 254, message 5000).
- (2026-09-28) **FIXED — false 500 on notification outage.** `sendBrevoEmail()` shared the outer `try` with the persist and never swallowed network errors, so a Brevo failure returned `500 "Failed to send message"` after Mongo had already committed — causing duplicate rows on retry and hiding a real outage. The email send now has its own inner `try/catch` that only logs; the route returns `201` once the document is persisted.
- (2026-09-28) **FIXED — project link injection.** `project.demo` / `project.github` were rendered into `href` with no validation and no empty-string guard, producing `href=""` links that reloaded the page. Anchors now render only when non-empty, and write-time validation requires `^https?://`.
- (2026-09-28) **FIXED — `.env` / `.env.production` were committable.** `.gitignore` ignored only `.env*.local`, leaving both valid Next.js load targets (`MONGODB_URI`, `BREVO_API_KEY`) exposed to accidental commit. Pattern is now `.env*` with `!.env.example`.
- (2026-09-28) **OPEN — no authentication anywhere in this repo (accepted by owner).** The public site is a static portfolio and the contact form must stay open to anonymous visitors, so no login/user system was built. Content management lives in the sibling `adminsukhjotportfolio` repo. If a write route is ever reintroduced here, it must gate on a server-side `ADMIN_API_TOKEN` compared with `crypto.timingSafeEqual` on equal-length buffers (never a `NEXT_PUBLIC_` var), with unit tests for both the allow and deny paths.
