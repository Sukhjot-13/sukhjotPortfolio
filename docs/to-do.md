# To-do

> 2026-09-26: first to-do file for this repo (previously none existed).
> 2026-09-28: resolved the `architecture.md` location item — file moved to `docs/architecture.md` per AGENTS.md. Security/bug/a11y audit pass completed in the same session.

- [ ] DB-backed API tests (gallery fallback, contact validation) when a test database is available
- [x] Decide with owner: move `architecture.md` (repo root) into `docs/` per AGENTS.md convention — done 2026-09-28 via `git mv`
- [ ] Replace the process-local contact rate limiter with a shared store (Redis/Upstash) if the site runs on more than one instance
- [ ] Add `prefers-reduced-motion` handling for the project-card 3D tilt and other Framer Motion animations
- [ ] If a content write route is ever reintroduced in this repo, gate it on a server-side `ADMIN_API_TOKEN` with `crypto.timingSafeEqual` and add positive/negative tests
- [ ] Consider splitting `tests/validate.test.ts` into per-module files once DB-backed API tests land
