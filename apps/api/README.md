# @tervox/api

Fastify 5 API service for Tervox. Stage 2 adds the persistence layer
(PostgreSQL via Drizzle ORM) on top of the Stage 1 foundation
(env validation, error envelope, `/health`, structured logging).

## Stage 2 scope

- Drizzle ORM (`drizzle-orm` + `drizzle-kit`) over the `postgres`
  driver.
- 14 tables per the MVP schema (see "Schema overview" below).
- Reproducible migrations committed under `drizzle/migrations/`.
- Idempotent dev seed (`npm run db:seed`) safe to re-run.
- Local Postgres via `docker compose up`.

What Stage 2 does NOT include: auth, WhatsApp, AI, dashboard,
state-machine transitions, business rules, or any product API
endpoints. The roteiro (script) is still hard-coded; only
`script_version` lives in the schema.

## Requirements

- Node >= 20.18.1 (matches the root template's `engines`).
- Docker (for the local Postgres container) — optional if you point
  `DATABASE_URL` at any reachable Postgres 14+ database.

## Environment

`.env.example` (in the repo root) documents the relevant vars. The
API service reads its own subset:

| Var           | Required | Source                                   |
| ------------- | -------- | ---------------------------------------- |
| `DATABASE_URL`| yes      | injected by Polsia in prod (rdbms)       |
| `API_HOST`    | no       | default `0.0.0.0`                        |
| `API_PORT`    | no       | default `4000`                           |
| `API_LOG_LEVEL` | no     | default `info`                           |
| `NODE_ENV`    | no       | default `development`                    |

`DATABASE_URL` is validated by `src/env.ts` (zod). Local-only defaults
for the docker-compose service:

```
DATABASE_URL=postgresql://tervox:tervox_dev@localhost:5432/tervox_dev
```

## Local Postgres

From `apps/api/`:

```bash
# Start Postgres on :5432 with healthcheck (tervox/tervox_dev/tervox_dev).
npm run db:up

# Tear down.
npm run db:down
```

`scripts/db-wait.sh` polls `pg_isready` so the migrate/seed steps that
follow `npm run db:up` don't flake on first boot.

## Migrations

Drizzle-kit writes migrations to `apps/api/drizzle/migrations/`.
Reproduce locally:

```bash
# Generate SQL from src/db/schema.ts (only when the schema changes).
npm run db:generate

# Apply pending migrations.
npm run db:migrate

# Push schema straight to the DB without an SQL file (dev convenience).
npm run db:push

# Drizzle Studio — inspect tables/rows in a web UI.
npm run db:studio
```

When the schema changes, generate the SQL, commit the new
`drizzle/migrations/<n>_<name>.sql` + meta entries, and apply.

## Seed

```bash
npm run db:seed
```

Idempotent — every row is resolved via lookup before insert, so a
second run inserts ZERO new rows. The seed creates:

- 1 tenant (`Acme Demo`, slug `acme-demo`).
- 1 demo user with `owner` membership.
- 1 demo WhatsApp channel.
- 2 demo contacts (Alice / Bob) with distinct phones so the
  `(tenant_id, phone)` uniqueness constraint is exercised.
- 1 intake + employment context + 2 intake issues (overtime, firing).
- 1 conversation on top of the intake.
- 3 messages with distinct `external_message_id`s (idempotency check).
- 2 consents (LGPD-equivalent scopes for Stage 2).
- 1 triage answer.
- 1 pending human review.

## Schema overview

| # | Table                  | Highlights                                    |
| - | ---------------------- | --------------------------------------------- |
| 1 | `tenants`              | Multi-tenant pivot. `slug` unique.            |
| 2 | `users`                | Brief verbatim (Stage 3 better-auth may overlap). |
| 3 | `memberships`          | `(tenant_id, user_id)` unique; role enum.     |
| 4 | `sessions`             | Brief verbatim (Stage 3 better-auth may overlap). |
| 5 | `whatsapp_channels`    | One per-tenant WABA credential.               |
| 6 | `contacts`             | **UNIQUE `(tenant_id, phone)`**.              |
| 7 | `intakes`              | Carries `script_version`.                     |
| 8 | `employment_contexts`  | Per-intake CTX fields.                        |
| 9 | `intake_issues`        | Many per intake.                              |
| 10 | `conversations`       | Carries `script_version`. Mirrors intake.     |
| 11 | `messages`            | **UNIQUE `(whatsapp_channel_id, external_message_id)`** (idempotency); `from_source` enum; nullable `origin_message_id` for reply-chain. |
| 12 | `consents`            | LGPD consent per contact × channel × scope.   |
| 13 | `triage_answers`      | `answer_payload` JSONB + optional fast-path `selected_option_id`. |
| 14 | `human_reviews`       | Operator takeover; `status` + `outcome` + `escalation_target`. |

Every domain table has `id uuid`, `tenant_id` (cascade to tenant),
`created_at`, `updated_at`, and an index on `tenant_id`.

## Run

```bash
# Dev (tsx watch).
npm run dev

# Type-check (NodeNext, strict).
npm run typecheck

# Build (tsc -p tsconfig.build.json).
npm run build

# Start (waits for Postgres, runs migrations, then boots the server).
npm start

# Tests (vitest).
npm run test
```

## Stage 2 modeling decisions vs. the brief

- `script_version` is placed on BOTH `intakes` AND `conversations`. The
  rationale: a conversation created against an older intake must
  remember the roteiro it was started under, even if current intakes
  have advanced to a newer version. Keeping the value on
  `conversations` decouples conversation behaviour from intake
  deletion/rotation.
- `from_source` is a Postgres enum (`user|bothuman|system`) instead of
  a free-text column — the brief's "origem" field always takes one of
  these four values and an enum blocks bad writes.
- `triage_answers.answer_payload` is `jsonb` (free-form structured
  answer), with `selected_option_id` reserved as a nullable fast-path
  id when the answer matches a known multiple-choice option.
- `messages.origin_message_id` is nullable and self-referencing — lets
  bot replies point to the user message they answered.
- `memberships` adds `uniqueIndex (tenant_id, user_id)` — a user can't
  hold two memberships in the same tenant. Brief did not explicitly
  require this but it's the natural primary candidate for the join.

### Multi-tenant integrity (I-1, I-2)

Two database-level invariants ensure multi-tenant row consistency.
Both are enforced by Drizzle against the live schema; the migration
that introduces them is `drizzle/migrations/0001_*.sql`.

- **I-1 — at most one conversation per non-null `intake_id`.** A
  partial unique index `conversations_intake_id_unique` on
  `conversations (intake_id) WHERE intake_id IS NOT NULL` rejects a
  second row whose intake_id is non-null and equals an existing row's
  intake_id (`SQLSTATE 23505 — unique_violation`). Rows with
  `intake_id = NULL` are NOT subject to the index (NULLs are not
  equal in btree unique), so multiple orphan conversations are
  explicitly allowed. The partial-predicate form is intentional: a
  full unique on `intake_id` would forbid even a single NULL row from
  being repeated.
  - **Known limitation — first-writer-wins race.** A racing pair of
    inserts that both try to create the first conversation on the
    same intake will produce one success and one `23505`; the
    application in Stage 3 is expected to retry with `ON CONFLICT`
    semantics or pre-fetch existing ids if it wants to be tolerant
    of that race. Schema-side enforcement is sufficient for
    correctness; the retry is a UX detail.
- **I-2 — no cross-tenant row references.** For every child table
  whose row carries `tenant_id` AND a FK pointing at a parent that
  ALSO carries `tenant_id`, an extra composite FK
  `(tenant_id, parent_id) → parent(tenant_id, id)` is added with the
  same `onDelete` action as the existing single-column FK:

  | Child table             | Composite FK columns                 | Parent (tenant_id, id)   | onDelete |
  | ----------------------- | ------------------------------------ | ------------------------ | -------- |
  | `intakes`               | `(tenant_id, contact_id)`            | `contacts`               | cascade  |
  | `intakes`               | `(tenant_id, whatsapp_channel_id)`   | `whatsapp_channels`      | cascade  |
  | `employment_contexts`   | `(tenant_id, intake_id)`             | `intakes`                | cascade  |
  | `intake_issues`         | `(tenant_id, intake_id)`             | `intakes`                | cascade  |
  | `conversations`         | `(tenant_id, contact_id)`            | `contacts`               | cascade  |
  | `conversations`         | `(tenant_id, whatsapp_channel_id)`   | `whatsapp_channels`      | cascade  |
  | `conversations`         | `(tenant_id, intake_id)`             | `intakes`                | set null |
  | `messages`              | `(tenant_id, conversation_id)`       | `conversations`          | cascade  |
  | `messages`              | `(tenant_id, whatsapp_channel_id)`   | `whatsapp_channels`      | cascade  |
  | `consents`              | `(tenant_id, contact_id)`            | `contacts`               | cascade  |
  | `consents`              | `(tenant_id, whatsapp_channel_id)`   | `whatsapp_channels`      | cascade  |
  | `triage_answers`        | `(tenant_id, intake_id)`             | `intakes`                | cascade  |
  | `human_reviews`         | `(tenant_id, conversation_id)`       | `conversations`          | set null |
  | `human_reviews`         | `(tenant_id, message_id)`            | `messages`               | set null |

  Tables NOT needing composite FKs (their parents are either the tenant
  itself or carry no `tenant_id`): `memberships` → `users`,
  `sessions` → `users`. An INSERT/UPDATE whose child `tenant_id` does
  not match the parent's `tenant_id` is rejected with
  `SQLSTATE 23503 — foreign_key_violation`. Composite FK with one
  nullable column (`conversations.intake_id`,
  `human_reviews.conversation_id`, `human_reviews.message_id`) still
  skips the check when the child side of the FK is NULL.
  - **Known limitation — no rewrite on re-parent.** The composite FK
    covers row-level consistency at INSERT/UPDATE time; it does NOT
    retroactively rewrite the `tenant_id` of an existing row to
    match a re-parented parent. The default `ON UPDATE NO ACTION`
    on each new FK correctly REJECTS reassigning a parent's
    `tenant_id` once children exist — safer for multi-tenant
    integrity than a silent rewrite.
  - **Known limitation — same-row cross-domain check.** The DB cannot
    enforce that two rows of the SAME domain table belong to the
    same tenant (e.g., two `intakes` rows under different
    `tenant_id`s referencing the same `contact_id` — that comparison
    would require a cross-query check). The application layer
    (Stage 3) is responsible for ensuring all reads scope by
    `tenant_id`; this round does not add that, since the brief
    scopes to schema only.

#### Integration test (`RUN_INTEGRATION=1 npm test`)

`src/db/multi-tenant-integrity.test.ts` proves both invariants against
a real Postgres. Each test TRUNCATEs all domain tables in FK CASCADE
reverse-dependency order and asserts Postgres error codes from
`postgres-js`:

- I-1 success: 2 rows on `conversations` with `intake_id = NULL`.
- I-1 failure: 2 rows on `conversations` with the same `intake_id`
  rejected with `23505` and `constraint_name =
  conversations_intake_id_unique`.
- I-2 failures (one per parent table): each cross-tenant child-row
  insert is rejected with `23503` and the matching
  `<table>_tenant_id_<col>_fk` constraint name.
- I-2 success: a `human_reviews` row with both nullable parents NULL
  is accepted (composite FK skips the check).
- I-2 success: two conversations with `intake_id = NULL` in the same
  tenant are accepted.

The suite self-gates: it runs only when `RUN_INTEGRATION=1` AND
`DATABASE_URL` is reachable from a `select 1` probe in `beforeAll`.
Default `npm test` (no flag) skips cleanly — template CI without a
Postgres container does not flake.

## Future Stage 3 notes

- The brief currently uses `users` and `sessions` tables. Stage 3 will
  install `better-auth`, which ships its own Prisma-bound `User`/`Session`
  models in the root app's Prisma schema. Either the Fastify service's
  `users`/`sessions` get aliased to point at the root's Prisma models,
  or the customer's other deployments override them. Stage 2 does not
  decide; flag for the customer.
- Production deployment of `apps/api` (the Fastify service) is not
  declared by `polsia.toml` today — it boots the root Next.js app
  only. Migrating `apps/api` to prod is a Stage 3 deploy-decoupling
  task.
