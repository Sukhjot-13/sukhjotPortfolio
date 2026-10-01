# Portfolio — Sukhjot

A full-stack developer's portfolio: projects, testimonials and a contact form,
built with Next.js 16 (App Router), React, TypeScript, Tailwind CSS and
MongoDB (Mongoose).

## Commands

```bash
npm run dev           # dev server
npm run build         # production build
npm start             # serve the production build
npm run lint          # eslint
npm run typecheck     # tsc --noEmit
npm test              # vitest
npm run manager:check # live check of the Manager integration (below)
```

## Configuration

`MONGODB_URI` is required (the app throws without it); the Brevo and
`ALLOWED_DEV_ORIGINS` variables are optional. See `.env.example` for the
annotated list and `docs/architecture.md` for the full variable table.

## Manager integration (optional)

This app can send its server error logs and page analytics to **Manager**, a
personal project control center. With no `MANAGER_*` variables set nothing
changes: the integration is a set of no-ops, so local development, CI and
previews are unaffected.

### What gets wired up

- Every API verb records real status/outcome under a request-local trace and schedules `after` flushing. Existing business errors retain their server stacks in Manager; requests omit query strings and submitted contact data.
- The browser captures console warnings/errors, uncaught errors, rejected promises and failed fetches once per window. Repeated provider mounts do not duplicate listeners or uploads.
- One analytics tag per document tracks pageviews and clicks, independently of the client log key. Missing Manager configuration or an unreachable Manager does not prevent application responses.

### Configuration

| Variable | Required for | Value |
|---|---|---|
| `MANAGER_ENDPOINT` | server logs | base URL of the **Manager** deployment — not this app's own port |
| `MANAGER_APP_ID` | server logs | project slug in Manager (`sukhjotportfolio`) |
| `MANAGER_LOG_KEY` | logs | `mlk_…` (server) |
| `MANAGER_ANALYTICS_KEY` | analytics | `mak_…` |
| `NEXT_PUBLIC_MANAGER_ENDPOINT` | browser logs + analytics | same value as `MANAGER_ENDPOINT` |
| `NEXT_PUBLIC_MANAGER_APP_ID` | browser logs + analytics | same value as `MANAGER_APP_ID` |
| `NEXT_PUBLIC_MANAGER_CLIENT_KEY` | browser logs | `mck_…` client key |
| `NEXT_PUBLIC_MANAGER_ANALYTICS_KEY` | analytics | `mak_…` |

**The `NEXT_PUBLIC_` block is required for any browser logging or analytics,
not optional.** Next.js only inlines a *literal* `process.env.NEXT_PUBLIC_FOO`
member expression into the client bundle; `process.env` in browser code is an
empty object and a dynamic `process.env[name]` lookup is not inlined either. A
`'use client'` module reading `MANAGER_ENDPOINT` therefore always resolves to
undefined, and the browser logger and the analytics tag are silently never
started — while every test still passes. Use the project's **client** key
(`mck_…`) there: Manager derives each entry's `source` from the key kind, so
browser entries must carry the client key rather than the server key.

`MANAGER_ENDPOINT` is Manager's own base URL (`http://127.0.0.1:3300` for a
local Manager). It is easy to get backwards and point it at this app's dev
port, which makes every log POST fail silently.

Set them in `.env.local` locally and in the Vercel project settings for
deployments. `.env.example` has the full annotated block; `.env.local` is
git-ignored and must never be committed.

### Refresh the vendored SDK

`lib/manager/logger.ts` is the whole SDK in one file (zero dependencies). To
update it:

```bash
curl -fsSL -H "x-manager-key: $MANAGER_LOG_KEY" \
  "http://127.0.0.1:3300/api/sdk/logger?format=ts" -o lib/manager/logger.ts
```

The key is read from the `x-manager-key` header, never from a URL. Commit the
refreshed file so everyone on the team gets the same version.

### Verify it works

```bash
npm run manager:check
# needs MANAGER_ENDPOINT, MANAGER_LOG_KEY, MANAGER_CLIENT_KEY, MANAGER_ANALYTICS_KEY
# and APP_ORIGIN pointing at a running `next start`
```

The checker requires exact accepted/rejected counts for each enabled key channel, verifies wrong-kind and unknown-key denials, and exercises this app's 404 and successful public reads. Set `MANAGER_READ_COOKIE` to an authorized Manager session to prove the app's completion row was stored under the incoming trace. Set `APP_ORIGIN_DEGRADED` to a second instance with an unreachable Manager to verify outage tolerance. Missing storage/outage evidence is reported as a skip.

The static-access guarantee is enforced by a test, not just by convention —
`tests/manager-integration.test.js` reads `lib/manager/config.ts` and fails if
any `NEXT_PUBLIC_*` value stops being a literal member expression (bracket
notation fails too) or if the client block ever starts indexing `process.env`.
To see the real bundled values, build and grep `.next/static`.

### Delivery tuning

Server logs do **not** flush on every write. The facade sets the SDK's
`flushIntervalMs` to 250ms, so a burst of N log lines becomes one HTTP request
instead of N. The window is deliberately short: serverless runtimes can freeze
timers after a response is sent, which would strand anything still batched.

`error` and `fatal` skip the window with a leading-edge flush — sent
immediately, but no more than once per 100ms, with a trailing flush so a burst
of 50 errors costs ~2 requests rather than 50.

```bash
node scripts/measure-log-delivery.mjs 200
```

The standalone measurement imports pure configuration, the SDK and shared server options, then explicitly flushes before exit. Results are measurements against the configured test Manager, not production guarantees. Request delivery additionally uses `after`; background timers alone do not guarantee serverless delivery.

`getManagerDroppedCount()` exposes the SDK's own discard count for health
checks; the re-vendored SDK raises its discards as a `warn` entry named
`manager_sdk_dropped_entries` rather than losing them, and its self-protection
ceiling is 500/s (a 50/s cap silently discarded most of a busy server's output).

## Verification

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` for the single suite, static checks and production output. See `docs/verification/manager-integration-2026-09-30.md` for isolated live application/browser/database checks. Public Manager values are baked into browser output; rebuild when changing them. Use the same `MONGODB_URI` as the admin app to share content.

## Documentation

`docs/architecture.md` (file + function inventory, env vars) ·
`docs/suggestions.md` (open items) · `docs/to-do.md` (session handoff)

The public testimonials page is temporarily hidden: its route returns 404 and the navigation link is removed. Existing testimonial data and admin editing remain available for later publication.
