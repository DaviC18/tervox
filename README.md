# polsia-next-v2

The canonical Next.js template for Polsia-generated customer apps.

This repository is a scaffold with the shadcn UI baseline built in. It ships the
framework defaults every app needs on day one: Next.js 16 App Router, React 19,
Tailwind 4, Prisma client wiring, Biome, Vitest, security headers, a token-driven
theme, and a broad shadcn primitive set. Product capabilities such as auth,
billing, email, analytics, dashboards, and multi-tenant workflows are installed
from `Polsia-Inc/modules`.

## What This Is

This is a template, not a hand-customized starter app. The Polsia engineering
agent reads the ownership map, installs modules when needed, and edits only the
bounded app-owned zones. The directory shape and `.polsia/ownership.json` are
the contract that keeps framework files, module files, and customer code
separate.

The canonical template id is `polsia-next-v2`; the GitHub repository is
`Polsia-Inc/template-next`.

## What Is Included

- Next.js 16 App Router, React 19, TypeScript, and Tailwind 4.
- shadcn UI baseline: `components.json`, `cn()`, a committed primitive set in
  `src/components/ui/**`, sonner toasts, next-themes, and theme tokens in
  `src/app/globals.css`.
- Prisma 6 client setup: `prisma/schema/_base.prisma`, `prisma.config.ts`, and
  the server-only singleton in `src/lib/db.ts`. The actual database is external;
  Polsia provisions Postgres and injects `DATABASE_URL`.
- Typed environment validation through `src/lib/env.ts`.
- Data-plane examples: a shared zod contract, an `/api/example` route handler,
  and a client page that uses `apiFetch`.
- CSP and security headers in `proxy.ts`, `next.config.ts`, and
  `src/lib/csp.ts`.
- SEO plumbing: `src/lib/brand.ts`, `src/lib/site.ts`, `robots.ts`,
  `sitemap.ts`, `manifest.ts`, and a default Open Graph image route.
- Unit tests covering the ownership map, CSP posture, env validation, and the
  example data contract.

## What Is Not Included

- No auth, billing, email, analytics, dashboards, or other product modules.
- No database server, Dockerfile, compose file, or Procfile.
- No real env files. `.env.example` documents the expected variables; deploys
  receive actual values from the platform.
- No Server Actions. Product pages call `/api/*` route handlers through
  `src/lib/api-client.ts`.

## Ownership Model

Always read `.polsia/installed.json`, `.polsia/ownership.json`, and
`.polsia/overrides.json` before editing.

| Tier | Examples | Who edits |
| --- | --- | --- |
| `framework_owned` | `src/lib/db.ts`, `src/lib/utils.ts`, `components.json`, `prisma.config.ts`, `AGENTS.md`, `.polsia/installed.json`, `.polsia/ownership.json` | Framework or owning module only. |
| `user_owned` | `src/components/ui/**`, `src/app/(setup)/page.tsx`, `src/app/(custom)/**`, `src/lib/brand.ts`, `src/lib/nav.ts`, `public/**`, `README.md`, `.polsia/overrides.json` | The app agent or customer. |
| `shared` | `src/app/globals.css`, `src/lib/env.ts`, `src/app/layout.tsx`, `proxy.ts`, `next.config.ts`, `package.json`, `.env.example` | Edit only through declared slots or the documented merge strategy. |

`.polsia/ownership.json` is the source of truth. Source banners are reader
signage only.

## What Not To Edit

- Anything marked `framework_owned` in `.polsia/ownership.json`.
  Comment-capable source files carry `@polsia:framework-owned` banners as
  signage, but the ownership map is the authority.
- Anything outside declared slot markers in shared files such as
  `next.config.ts`, `proxy.ts`, `src/lib/env.ts`, `src/app/layout.tsx`, and
  `src/app/globals.css`.
- `.polsia/installed.json` and `.polsia/ownership.json`. They are generated
  state files. Use `.polsia/overrides.json` for hand-editable module policy.

## Platform Rules

- Keep Cache Components off unless the platform explicitly changes that policy.
- Use `proxy.ts`; do not add `middleware.ts`.
- Keep data and mutations behind `/api/*` route handlers. Do not add Server
  Actions.
- Keep Prisma datasource and generator declarations in `prisma/schema/_base.prisma`.
  App or module schema files add models only.
- `src/app/(auth)/**` and `src/app/(dashboard)/**` pages are user-owned — build and
  restyle them freely. Don't hand-roll the auth security surface (`src/lib/auth.ts`,
  `src/app/api/auth/**`, the prisma auth schema, `require-auth`/`require-admin`):
  those are framework-owned, installed by the auth module.
- Put recurring work in `polsia.toml` `[[crons]]`; do not use in-process
  schedulers for product behavior.

## Agent Workflow

1. Read `AGENTS.md` and the three `.polsia/` state files.
2. Decide whether the request is app-specific UI/business logic or a reusable
   capability that should come from a module.
3. Install modules through the Polsia module installer when a module owns the
   capability. Do not clone module files by hand.
4. Write app-specific code in user-owned areas:
   - Routes: `src/app/(custom)/<feature>/page.tsx`
   - API handlers: `src/app/api/<resource>/route.ts`
   - Contracts: `src/lib/contracts/<resource>.ts`
   - Business logic: `src/lib/business/<feature>.ts`
   - Custom components: `src/components/custom/<feature>.tsx`
   - Hooks: `src/hooks/use-<feature>.ts`
5. Replace the starter home by editing `src/app/(setup)/page.tsx` in place, or
   delete the `(setup)` route group before adding another page that resolves to
   `/`.
6. Set the product identity in `src/lib/brand.ts`, update `src/lib/nav.ts` for
   reachable public pages, and rely on the built-in robots, sitemap, metadata,
   and Open Graph plumbing.
7. Keep every feature reachable from the home page or, for authenticated
   features, the dashboard.
8. Run the relevant checks before shipping.

Module installs go through the Polsia module installer. The installer owns
module file writes, ownership-map updates, install hashes, and module validators.
Do not clone module files or copy them by hand.

## Data Plane

Product pages are client components. They call route handlers through
`apiFetch`, passing a shared zod schema to validate the response at runtime.

Each resource should have one shared contract in `src/lib/contracts/<resource>.ts`.
The route handler validates request and response shapes with that contract, and
the client imports the same schema.

Validation errors from route handlers use:

```ts
{ errors: { fieldName: 'Message' } }
```

Client forms map those errors with `applyServerErrors`. Transient success or
unexpected failure feedback should use `toast` from `sonner`.

## UI

The template already includes a broad shadcn primitive set under
`src/components/ui/**`. Compose those primitives first, restyle through theme
tokens and component variants, and add new primitives with:

```bash
npx shadcn@latest add <name> --yes
```

Reusable app-specific UI belongs in `src/components/custom/**`.

## Directory Guide

```text
.
├── .polsia/                          Generated state and ownership map
├── prisma/
│   ├── schema/_base.prisma           Datasource + generator only
│   └── migrations/migration_lock.toml Project-level migration lock
├── public/                           Customer assets
├── src/
│   ├── app/
│   │   ├── (setup)/page.tsx          Starter home served at /
│   │   ├── (custom)/example/page.tsx Data-plane example page
│   │   ├── api/example/route.ts      Data-plane example route
│   │   ├── health/route.ts           Deploy healthcheck
│   │   ├── layout.tsx                Root layout and providers slot
│   │   └── globals.css               Tailwind theme and brand token slot
│   ├── components/
│   │   ├── ui/                       shadcn primitives
│   │   ├── custom/                   App-owned compositions
│   │   └── theme-provider.tsx        next-themes wrapper
│   ├── hooks/                        App-owned React hooks
│   ├── lib/
│   │   ├── api-client.ts             Client transport helper
│   │   ├── brand.ts                  Product name and description
│   │   ├── contracts/example.ts      Example shared zod contract
│   │   ├── csp.ts                    CSP builder
│   │   ├── db.ts                     Prisma singleton
│   │   ├── env.ts                    Typed env schema
│   │   ├── forms.ts                  Server error mapping
│   │   ├── nav.ts                    App navigation config
│   │   └── utils.ts                  cn()
│   └── modules/                      Vendored module installs
├── tests/unit/                       Vitest unit tests
├── next.config.ts                    Next config and security headers
├── proxy.ts                          CSP nonce and middleware chain slot
├── polsia.toml                       Deploy manifest and scheduled jobs
└── AGENTS.md                         Engineering agent operating manual
```

## Security Headers

`next.config.ts` sets baseline response headers:

- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Resource-Policy`

`proxy.ts` sets a per-request Content Security Policy. `script-src` stays strict
with a nonce and `strict-dynamic`; `style-src` allows inline styles so Radix and
shadcn runtime positioning works in production.

## Day-1 Validators

The bare scaffold validator floor is declared in
`.polsia/installed.json#day_1_floor`. Module-specific validators are added by
module manifests when modules install.

- `no-secrets-in-client-bundle`
- `server-only-import-on-secret-modules`
- `agent-has-no-prod-db-credentials`
- `db-ssl-required`
- `parameterized-queries-only`
- `security-headers-present`
- `lockfile-committed-and-pinned`
- `lifecycle-scripts-disabled`
- `next-version-not-affected-by-cve-2025-29927`

## Local Development

Use npm; the lockfile is committed.

```bash
npm install
npm run typecheck
npm run lint
npm run test
SKIP_ENV_VALIDATION=1 npm run dev
```

`npm run dev` and `npm run build` validate `DATABASE_URL` and
`NEXT_PUBLIC_APP_URL` when `SKIP_ENV_VALIDATION` is not set. On a local clone
without a provisioned database, either set the required vars in `.env.local` or
prefix the command with `SKIP_ENV_VALIDATION=1`.

`typecheck`, `lint`, and `test` do not require env. With no modules installed,
`/` serves the `(setup)` placeholder until a module or app-authored root page
takes over.

## Versions

Pinned exact versions are used for the framework stack:

- Next.js 16.2.6, App Router
- React 19.2.7
- Tailwind CSS 4.3.0, CSS-first `@theme`
- shadcn/ui New York style
- sonner 2.0.7
- TypeScript 5.5.4, strict mode
- Biome 2.3.1, lint and format
- Vitest 3.2.6
- Prisma 6.19.3
- Node >=20.18.1

Security `overrides` in `package.json` pin patched transitive dependency
versions that direct framework pins cannot reach on their own.

## License

MIT. See [LICENSE](./LICENSE).

## Monorepo Layout (Stage 1)

Stage 1 introduces a small npm-workspaces monorepo on top of the Next.js
scaffold. Three workspaces, all TypeScript + ESM + `NodeNext`:

| Path                         | Package             | Purpose                                                                                                  |
| ---------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------- |
| `apps/web` (the repo root)   | `polsia-app-template` | Next.js 16 app — unchanged from the template. Polsia still deploys and healthchecks only this app.     |
| `apps/api`                   | `@tervox/api`        | Fastify 5 API service (Stage 1: foundation only — env validation, error envelope, `/health` endpoint).  |
| `packages/contracts`         | `@tervox/contracts`  | Shared Zod contracts imported by both apps (Stage 1: `HealthCheckResponse`, `ApiErrorEnvelope`).         |

Stage 1 is **local-only for the API.** `polsia.toml` still boots Next only
(`start = "npx prisma db push … && npm start"`); the Fastify service is not
auto-deployed. Provisioning the Fastify service for prod (e.g. a Render
service via `.agents/skill-docs/render-infra`) and exposing both apps for
real traffic is **Stage 2.** The deployed artifact at Stage 1 is still the
Next.js app with `/health` returning `{status:"healthy"}`.

### Local Development

```bash
npm install                     # Hoists deps for the root + both workspaces.
npm run dev:all                 # Runs `next dev` (:3000) and Fastify (:4000) concurrently.
npm run dev:web                 # Next only.
npm run dev:api                 # Fastify only.
```

`npm run dev:api` and `npm run dev:all` both run `tsx watch src/server.ts`,
which evaluates `apps/api/src/env.ts` first — the server refuses to boot if
`API_HOST`/`API_PORT`/`API_LOG_LEVEL`/`NODE_ENV` are invalid. `.env.example`
documents the local-only API vars (Polsia does NOT inject them at deploy in
Stage 1).

### Tests

```bash
npm run test           # Root: identity, csp, env, instrumentation, ownership map (jsdom).
npm run test:contracts # @tervox/contracts: zod parse/fail cases on the shared schemas.
npm run test:api       # @tervox/api: env, logger, error handler, /health.
npm run test:all       # All three in sequence.
```

### Type-check + Build

```bash
npm run typecheck              # Root (Next).
npm run typecheck:api          # apps/api (NodeNext).
npm run typecheck:contracts    # packages/contracts (NodeNext).
npm run build:api              # builds apps/api to apps/api/dist via tsconfig.build.json.
```

### Smoke Test

```bash
npm run dev:all &
curl http://localhost:4000/health | jq .            # Fastify (parseable by HealthCheckResponse).
curl http://localhost:3000/health | jq .            # Next    ({status:"healthy"}).
```

### What's Deliberately Out of Stage 1

No business rules, no PostgreSQL/Drizzle/Prisma mutations, no migrations, no
auth, no tenant isolation, no WhatsApp/AI/triage, no contacts/intakes/dashboard
business screens, no PDF/metrics/automation, no module installs. Stage 2+
adds those.

## Stage 2 — Persistence (PostgreSQL + Drizzle)

Stage 2 adds the data plane for `apps/api`. The Prisma stack under `prisma/`
(directory owned by `template-next`) stays untouched. Drizzle lives **inside
`apps/api`** — its schema, migrations, and seed are all under `apps/api/src/db/`
+ `apps/api/drizzle/`.

### What ships in Stage 2

- **14 tables** matching the Stage 2 brief: `tenants`, `users`, `memberships`,
  `sessions`, `whatsapp_channels`, `contacts`, `intakes`,
  `employment_contexts`, `intake_issues`, `conversations`, `messages`,
  `consents`, `triage_answers`, `human_reviews`.
- **Drizzle ORM** + `drizzle-kit` + `postgres` driver over PostgreSQL.
- **Reproducible migrations** committed under `apps/api/drizzle/migrations/`
  (`0000_curved_cable.sql` + meta). Re-running `npm run db:generate` is a no-op.
- **Idempotent dev seed** (`npm run db:seed`). Inserts the demo tenant,
  demo user, demo WhatsApp channel, two demo contacts, one intake + context
  + issues, one conversation + messages, two consents, one triage answer,
  one human review. Re-running inserts zero new rows.
- **Two named uniqueness constraints** are live and tested:
  - `contacts (tenant_id, phone)` — phone-within-tenant.
  - `messages (whatsapp_channel_id, external_message_id)` — webhook
    idempotency on inbound WhatsApp payloads.
- **Multi-tenant isolation** — every domain table carries `tenant_id`
  (FK → `tenants.id` `ON DELETE CASCADE`) plus a `tenant_id` index.

### Local Postgres for `apps/api`

```bash
# Bring the dev database up (Postgres 16 alpine) and wait until ready.
npm run db:up

# Apply migrations.
npm run db:migrate

# Seed demo rows.
npm run db:seed

# Wipe + recreate + reseed (dev convenience).
npm run db:reset

# Tear down the container.
npm run db:down
```

All of the above forwards to the workspace: `npm run db:up` is the same as
`npm run --workspace @tervox/api db:up`. Default connection string for the
containerised Postgres:

```
postgresql://tervox:tervox_dev@localhost:5432/tervox_dev
```

The container is `tervox-postgres` (named volume `tervox_pg`) — `db-wait.sh`
polls `pg_isready` so migrations don't race the first-up boot.

### Drizzle scripts (workspace-level)

```bash
npm run db:api:generate       # diff schema -> SQL migration
npm run db:migrate            # apply pending migrations
npm run db:seed               # idempotent seed
npm run db:up                 # docker compose up + wait
npm run db:down               # docker compose down
npm run db:reset              # drop + recreate + migrate + seed
```

### Modeling decisions differing from the brief

- `script_version` lives on BOTH `intakes` AND `conversations`. A conversation
  created against an older intake must remember the roteiro it was started
  under, even when current intakes have advanced to a newer version. Keeping
  it on `conversations` decouples conversation behaviour from intake
  rotation.
- `messages.from_source` is a Postgres enum (`user|bothuman|system`) instead
  of a free-text column — an enum blocks bad writes.
- `triage_answers.answer_payload` is `jsonb` (free-form structured answer),
  with `selected_option_id` reserved as a nullable fast-path id for
  multiple-choice matches.
- `messages.origin_message_id` is nullable and self-referencing — lets a bot
  reply point to the user message it answered.
- `memberships` adds `uniqueIndex (tenant_id, user_id)` — a user can't hold
  two memberships in the same tenant.

### Future Stage 3 notes

- The brief's `users`/`sessions` tables currently live in `apps/api`. Stage 3
  installs `better-auth`, which ships its own Prisma-bound `User`/`Session`
  in the root app's Prisma schema. Either the Fastify service's `users`/
  `sessions` get aliased to point at the root's Prisma models, or the
  customer's other deployments override them. Stage 2 does not decide; flag
  for the customer.
- `polsia.toml` currently drives only the root Next.js deploy. Production
  deployment of `apps/api` (and the rights for it to run migrations at
  startup) is a Stage 3 deploy-decoupling task.

```
tervox
├─ .npmrc
├─ .polsia
│  ├─ installed.json
│  ├─ overrides.json
│  └─ ownership.json
├─ AGENTS.md
├─ LICENSE
├─ README.md
├─ apps
│  └─ api
│     ├─ README.md
│     ├─ docker-compose.yml
│     ├─ drizzle
│     │  └─ migrations
│     │     ├─ 0000_bizarre_jackpot.sql
│     │     ├─ 0001_chunky_doorman.sql
│     │     └─ meta
│     │        ├─ 0000_snapshot.json
│     │        ├─ 0001_snapshot.json
│     │        └─ _journal.json
│     ├─ drizzle.config.ts
│     ├─ package.json
│     ├─ scripts
│     │  ├─ db-reset.sh
│     │  └─ db-wait.sh
│     ├─ src
│     │  ├─ db
│     │  │  ├─ client.ts
│     │  │  ├─ multi-tenant-integrity.test.ts
│     │  │  ├─ schema.ts
│     │  │  └─ seed.ts
│     │  ├─ env.test.ts
│     │  ├─ env.ts
│     │  ├─ lib
│     │  │  ├─ errors.test.ts
│     │  │  ├─ errors.ts
│     │  │  ├─ logger.test.ts
│     │  │  └─ logger.ts
│     │  ├─ routes
│     │  │  ├─ health.test.ts
│     │  │  └─ health.ts
│     │  └─ server.ts
│     ├─ test
│     │  └─ setup.ts
│     ├─ tsconfig.build.json
│     ├─ tsconfig.json
│     └─ vitest.config.ts
├─ biome.json
├─ components.json
├─ next.config.ts
├─ next.user-config.ts
├─ package-lock.json
├─ package.json
├─ packages
│  └─ contracts
│     ├─ package.json
│     ├─ src
│     │  ├─ errors.test.ts
│     │  ├─ errors.ts
│     │  ├─ health.test.ts
│     │  ├─ health.ts
│     │  └─ index.ts
│     ├─ tsconfig.json
│     └─ vitest.config.ts
├─ polsia.toml
├─ postcss.config.mjs
├─ prisma
│  ├─ migrations
│  │  └─ migration_lock.toml
│  └─ schema
│     └─ _base.prisma
├─ prisma.config.ts
├─ proxy.ts
├─ public
├─ src
│  ├─ app
│  │  ├─ (custom)
│  │  │  └─ example
│  │  │     └─ page.tsx
│  │  ├─ (setup)
│  │  │  └─ page.tsx
│  │  ├─ api
│  │  │  └─ example
│  │  │     └─ route.ts
│  │  ├─ custom-style.css
│  │  ├─ error.tsx
│  │  ├─ global-error.tsx
│  │  ├─ globals.css
│  │  ├─ health
│  │  │  └─ route.ts
│  │  ├─ icon.svg
│  │  ├─ layout.tsx
│  │  ├─ manifest.ts
│  │  ├─ not-found.tsx
│  │  ├─ opengraph-image.tsx
│  │  ├─ robots.ts
│  │  └─ sitemap.ts
│  ├─ components
│  │  ├─ custom
│  │  │  ├─ faq.tsx
│  │  │  ├─ global-mounts.tsx
│  │  │  ├─ head-content.tsx
│  │  │  ├─ section-card.tsx
│  │  │  ├─ site-nav.tsx
│  │  │  └─ theme-toggle.tsx
│  │  ├─ polsia-analytics.tsx
│  │  ├─ providers.tsx
│  │  ├─ theme-provider.tsx
│  │  └─ ui
│  │     ├─ accordion.tsx
│  │     ├─ alert.tsx
│  │     ├─ avatar.tsx
│  │     ├─ badge.tsx
│  │     ├─ breadcrumb.tsx
│  │     ├─ button.tsx
│  │     ├─ card.tsx
│  │     ├─ checkbox.tsx
│  │     ├─ dialog.tsx
│  │     ├─ dropdown-menu.tsx
│  │     ├─ form.tsx
│  │     ├─ input.tsx
│  │     ├─ label.tsx
│  │     ├─ pagination.tsx
│  │     ├─ popover.tsx
│  │     ├─ progress.tsx
│  │     ├─ radio-group.tsx
│  │     ├─ select.tsx
│  │     ├─ separator.tsx
│  │     ├─ sheet.tsx
│  │     ├─ skeleton.tsx
│  │     ├─ slider.tsx
│  │     ├─ sonner.tsx
│  │     ├─ switch.tsx
│  │     ├─ table.tsx
│  │     ├─ tabs.tsx
│  │     ├─ textarea.tsx
│  │     └─ tooltip.tsx
│  ├─ hooks
│  ├─ instrumentation.ts
│  ├─ lib
│  │  ├─ api-client.ts
│  │  ├─ brand.ts
│  │  ├─ contracts
│  │  │  └─ example.ts
│  │  ├─ csp.ts
│  │  ├─ db.ts
│  │  ├─ env.ts
│  │  ├─ forms.ts
│  │  ├─ locale.ts
│  │  ├─ nav.ts
│  │  ├─ permissions-policy.ts
│  │  ├─ robots-config.ts
│  │  ├─ seed.ts
│  │  ├─ seo-routes.ts
│  │  ├─ site.ts
│  │  ├─ utils.ts
│  │  └─ viewport-config.ts
│  └─ modules
├─ tests
│  └─ unit
│     ├─ csp.test.ts
│     ├─ env-validation.test.ts
│     ├─ example
│     │  └─ contract.test.ts
│     ├─ instrumentation.test.ts
│     ├─ ownership-map.test.ts
│     ├─ permissions-policy.test.ts
│     └─ sanity.test.ts
├─ tsconfig.json
└─ vitest.config.ts

```