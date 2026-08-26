// Stage 2 multi-tenant integrity constraints — integration tests
// against a real Postgres database.
//
// Gating: tests are skipped unless `RUN_INTEGRATION=1` is set AND
// `DATABASE_URL` points at a reachable Postgres. This file is loaded
// by the default `npm test` glob (`src/**/*.test.{ts,tsx}`) but
// skips cleanly when DATABASE_URL is unreachable so that template CI
// without a Postgres container does not fail.
//
// What this file proves:
//   I-1 — `conversations.intake_id` carries a PARTIAL UNIQUE INDEX
//         WHERE intake_id IS NOT NULL, so at most one conversation
//         per non-null intake_id is allowed; multiple null intake_id
//         rows are explicitly allowed.
//   I-2 — every child table that points at a parent table which also
//         carries a tenant_id is connected by a COMPOSITE FK
//         `(tenant_id, parent_id) → parent(tenant_id, id)` so an
//         INSERT/UPDATE whose child tenant_id differs from the parent's
//         tenant_id is rejected with SQLSTATE 23503.

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const RUN_INTEGRATION = process.env.RUN_INTEGRATION === '1';
const DATABASE_URL = process.env.DATABASE_URL;

const describeIf = RUN_INTEGRATION && DATABASE_URL ? describe : describe.skip;

interface TenantFixture {
  tenantId: string;
  channelId: string;
  contactId: string;
  intakeId: string;
  conversationId: string;
}

type Row = { id: string };

function expectRow(row: Row | undefined, label: string): Row {
  if (!row) throw new Error(`expected ${label} to be returned`);
  return row;
}

async function ping(url: string): Promise<boolean> {
  const client = postgres(url, { max: 1, ssl: 'require', connect_timeout: 5 });
  try {
    await client`select 1`;
    return true;
  } catch {
    return false;
  } finally {
    await client.end({ timeout: 1 });
  }
}

describeIf('Stage 2 multi-tenant integrity', () => {
  let url = (DATABASE_URL ?? '').replace(
    '?channel_binding=require&sslmode=require',
    '?sslmode=require',
  );

  let client: ReturnType<typeof postgres>;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    const reachable = await ping(url);
    if (!reachable) {
      // Surface as a quiet skip rather than a hard fail so default CI
      // without a Postgres container does not flake.
      throw new Error('skipping: Postgres unreachable at DATABASE_URL');
    }
    client = postgres(url, { max: 4, ssl: 'require' });
    db = drizzle(client);
  });

  afterAll(async () => {
    if (client) await client.end({ timeout: 5 });
  });

  // Reset fixture between tests, in FK CASCADE reverse-dependency order.
  async function truncateAll(): Promise<void> {
    await client.unsafe(`
      TRUNCATE TABLE
        human_reviews,
        triage_answers,
        consents,
        messages,
        conversations,
        intakes,
        intake_issues,
        employment_contexts,
        contacts,
        whatsapp_channels,
        memberships,
        sessions,
        users,
        tenants
      RESTART IDENTITY CASCADE
    `);
  }

  async function seedTenant(slug: string): Promise<TenantFixture> {
    const tenantRows = await db.execute<Row>(sql`
      INSERT INTO tenants (name, slug) VALUES (${slug}, ${slug}) RETURNING id
    `);
    const tenantId = expectRow(tenantRows[0], 'tenant').id;

    await db.execute(sql`
      INSERT INTO users (email, name) VALUES (${`${slug}@tervox.test`}, ${slug})
    `);

    const channelRows = await db.execute<Row>(sql`
      INSERT INTO whatsapp_channels (tenant_id, phone_number_id, business_account_id, access_token)
      VALUES (${tenantId}::uuid, ${`pn-${slug}`}, ${`ba-${slug}`}, ${`tok-${slug}`})
      RETURNING id
    `);
    const channelId = expectRow(channelRows[0], 'channel').id;

    const contactRows = await db.execute<Row>(sql`
      INSERT INTO contacts (tenant_id, phone, name)
      VALUES (${tenantId}::uuid, ${`+55${slug.slice(0, 8)}`}, ${slug})
      RETURNING id
    `);
    const contactId = expectRow(contactRows[0], 'contact').id;

    const intakeRows = await db.execute<Row>(sql`
      INSERT INTO intakes (tenant_id, contact_id, whatsapp_channel_id, script_version, state)
      VALUES (${tenantId}::uuid, ${contactId}::uuid, ${channelId}::uuid, ${'v1'}, ${'open'})
      RETURNING id
    `);
    const intakeId = expectRow(intakeRows[0], 'intake').id;

    const convRows = await db.execute<Row>(sql`
      INSERT INTO conversations (tenant_id, contact_id, whatsapp_channel_id, intake_id, script_version)
      VALUES (${tenantId}::uuid, ${contactId}::uuid, ${channelId}::uuid, ${intakeId}::uuid, ${'v1'})
      RETURNING id
    `);
    const conversationId = expectRow(convRows[0], 'conversation').id;

    return { tenantId, channelId, contactId, intakeId, conversationId };
  }

  // Seed without the conversation step — used when a test needs an
  // intake_id with no existing conversation so the partial unique
  // index doesn't shadow the cross-tenant FK check we are testing.
  async function seedTenantNoConv(slug: string): Promise<TenantFixture> {
    const f = await seedTenant(slug);
    await db.execute(sql`DELETE FROM conversations WHERE tenant_id = ${f.tenantId}::uuid`);
    return f;
  }

  beforeEach(async () => {
    await truncateAll();
  });

  // Helper: Postgres error code from `postgres-js` driver. `23505` —
  // unique_violation; `23503` — foreign_key_violation.
  type PgError = Error & { code?: string; constraint_name?: string };

  async function expectPgCode(
    p: () => Promise<unknown>,
    code: string,
    constraintName: string,
  ): Promise<void> {
    try {
      await p();
    } catch (e) {
      const err = e as PgError;
      expect(err.code).toBe(code);
      expect(err.constraint_name).toBe(constraintName);
      return;
    }
    throw new Error(`expected ${code} on ${constraintName}, but insert succeeded`);
  }

  // I-1 ---------------------------------------------------------------

  it('I-1 success: null intake_id allows multiple conversations', async () => {
    const t = await seedTenant('t1');
    await db.execute(sql`
      INSERT INTO conversations (tenant_id, contact_id, whatsapp_channel_id, intake_id, script_version)
      VALUES (${t.tenantId}::uuid, ${t.contactId}::uuid, ${t.channelId}::uuid, NULL, 'v1')
    `);
    await db.execute(sql`
      INSERT INTO conversations (tenant_id, contact_id, whatsapp_channel_id, intake_id, script_version)
      VALUES (${t.tenantId}::uuid, ${t.contactId}::uuid, ${t.channelId}::uuid, NULL, 'v1')
    `);
    const rows = await db.execute<{ n: number }>(
      sql`SELECT COUNT(*)::int AS n FROM conversations WHERE intake_id IS NULL`,
    );
    const n = rows[0]?.n ?? 0;
    expect(n).toBeGreaterThanOrEqual(2);
  });

  it('I-1 failure: two conversations on the same intake_id are rejected (23505)', async () => {
    const t = await seedTenant('t2');
    await expectPgCode(
      () =>
        db.execute(sql`
          INSERT INTO conversations (tenant_id, contact_id, whatsapp_channel_id, intake_id, script_version)
          VALUES (${t.tenantId}::uuid, ${t.contactId}::uuid, ${t.channelId}::uuid, ${t.intakeId}::uuid, 'v1')
        `),
      '23505',
      'conversations_intake_id_unique',
    );
  });

  // I-2 — failures: each represents a child row whose parent lives in a
  // different tenant than the child's tenant_id.

  it('I-2 failure: intakes referencing cross-tenant contact rejected (23503)', async () => {
    const t1 = await seedTenant('a');
    const t2 = await seedTenant('b');
    await expectPgCode(
      () =>
        db.execute(sql`
          INSERT INTO intakes (tenant_id, contact_id, whatsapp_channel_id, script_version, state)
          VALUES (${t1.tenantId}::uuid, ${t2.contactId}::uuid, ${t1.channelId}::uuid, 'v1', 'open')
        `),
      '23503',
      'intakes_tenant_id_contact_id_fk',
    );
  });

  it('I-2 failure: intakes referencing cross-tenant channel rejected (23503)', async () => {
    const t1 = await seedTenant('c');
    const t2 = await seedTenant('d');
    await expectPgCode(
      () =>
        db.execute(sql`
          INSERT INTO intakes (tenant_id, contact_id, whatsapp_channel_id, script_version, state)
          VALUES (${t1.tenantId}::uuid, ${t1.contactId}::uuid, ${t2.channelId}::uuid, 'v1', 'open')
        `),
      '23503',
      'intakes_tenant_id_whatsapp_channel_id_fk',
    );
  });

  it('I-2 failure: conversations referencing cross-tenant contact rejected (23503)', async () => {
    const t1 = await seedTenant('e');
    const t2 = await seedTenant('f');
    await expectPgCode(
      () =>
        db.execute(sql`
          INSERT INTO conversations (tenant_id, contact_id, whatsapp_channel_id, intake_id, script_version)
          VALUES (${t1.tenantId}::uuid, ${t2.contactId}::uuid, ${t1.channelId}::uuid, NULL, 'v1')
        `),
      '23503',
      'conversations_tenant_id_contact_id_fk',
    );
  });

  it('I-2 failure: conversations referencing cross-tenant channel rejected (23503)', async () => {
    const t1 = await seedTenant('g');
    const t2 = await seedTenant('h');
    await expectPgCode(
      () =>
        db.execute(sql`
          INSERT INTO conversations (tenant_id, contact_id, whatsapp_channel_id, intake_id, script_version)
          VALUES (${t1.tenantId}::uuid, ${t1.contactId}::uuid, ${t2.channelId}::uuid, NULL, 'v1')
        `),
      '23503',
      'conversations_tenant_id_whatsapp_channel_id_fk',
    );
  });

  it('I-2 failure: conversations referencing cross-tenant intake rejected (23503)', async () => {
    const t1 = await seedTenant('i');
    const t2 = await seedTenantNoConv('j');
    await expectPgCode(
      () =>
        db.execute(sql`
          INSERT INTO conversations (tenant_id, contact_id, whatsapp_channel_id, intake_id, script_version)
          VALUES (${t1.tenantId}::uuid, ${t1.contactId}::uuid, ${t1.channelId}::uuid, ${t2.intakeId}::uuid, 'v1')
        `),
      '23503',
      'conversations_tenant_id_intake_id_fk',
    );
  });

  it('I-2 failure: messages referencing cross-tenant conversation rejected (23503)', async () => {
    const t1 = await seedTenant('k');
    const t2 = await seedTenant('l');
    await expectPgCode(
      () =>
        db.execute(sql`
          INSERT INTO messages (tenant_id, conversation_id, whatsapp_channel_id, external_message_id, from_source, body)
          VALUES (${t1.tenantId}::uuid, ${t2.conversationId}::uuid, ${t1.channelId}::uuid, 'm-cross-conv', 'user', 'hi')
        `),
      '23503',
      'messages_tenant_id_conversation_id_fk',
    );
  });

  it('I-2 failure: messages referencing cross-tenant channel rejected (23503)', async () => {
    const t1 = await seedTenant('m');
    const t2 = await seedTenant('n');
    await expectPgCode(
      () =>
        db.execute(sql`
          INSERT INTO messages (tenant_id, conversation_id, whatsapp_channel_id, external_message_id, from_source, body)
          VALUES (${t1.tenantId}::uuid, ${t1.conversationId}::uuid, ${t2.channelId}::uuid, 'm-cross-ch', 'user', 'hi')
        `),
      '23503',
      'messages_tenant_id_whatsapp_channel_id_fk',
    );
  });

  it('I-2 failure: consents referencing cross-tenant contact rejected (23503)', async () => {
    const t1 = await seedTenant('o');
    const t2 = await seedTenant('p');
    await expectPgCode(
      () =>
        db.execute(sql`
          INSERT INTO consents (tenant_id, contact_id, whatsapp_channel_id, scope)
          VALUES (${t1.tenantId}::uuid, ${t2.contactId}::uuid, ${t1.channelId}::uuid, 'data_processing')
        `),
      '23503',
      'consents_tenant_id_contact_id_fk',
    );
  });

  it('I-2 failure: consents referencing cross-tenant channel rejected (23503)', async () => {
    const t1 = await seedTenant('q');
    const t2 = await seedTenant('r');
    await expectPgCode(
      () =>
        db.execute(sql`
          INSERT INTO consents (tenant_id, contact_id, whatsapp_channel_id, scope)
          VALUES (${t1.tenantId}::uuid, ${t1.contactId}::uuid, ${t2.channelId}::uuid, 'data_processing')
        `),
      '23503',
      'consents_tenant_id_whatsapp_channel_id_fk',
    );
  });

  it('I-2 failure: employment_contexts referencing cross-tenant intake rejected (23503)', async () => {
    const t1 = await seedTenant('s');
    const t2 = await seedTenant('t');
    await expectPgCode(
      () =>
        db.execute(sql`
          INSERT INTO employment_contexts (tenant_id, intake_id, job_title)
          VALUES (${t1.tenantId}::uuid, ${t2.intakeId}::uuid, 'dev')
        `),
      '23503',
      'employment_contexts_tenant_id_intake_id_fk',
    );
  });

  it('I-2 failure: intake_issues referencing cross-tenant intake rejected (23503)', async () => {
    const t1 = await seedTenant('u');
    const t2 = await seedTenant('v');
    await expectPgCode(
      () =>
        db.execute(sql`
          INSERT INTO intake_issues (tenant_id, intake_id, issue_type)
          VALUES (${t1.tenantId}::uuid, ${t2.intakeId}::uuid, 'overtime')
        `),
      '23503',
      'intake_issues_tenant_id_intake_id_fk',
    );
  });

  it('I-2 failure: triage_answers referencing cross-tenant intake rejected (23503)', async () => {
    const t1 = await seedTenant('x');
    const t2 = await seedTenant('y');
    const payload = JSON.stringify({ yes: true });
    await expectPgCode(
      () =>
        db.execute(sql`
          INSERT INTO triage_answers (tenant_id, intake_id, question_id, answer_payload)
          VALUES (${t1.tenantId}::uuid, ${t2.intakeId}::uuid, 'q1', ${payload}::jsonb)
        `),
      '23503',
      'triage_answers_tenant_id_intake_id_fk',
    );
  });

  it('I-2 failure: human_reviews referencing cross-tenant conversation rejected (23503)', async () => {
    const t1 = await seedTenant('z');
    const t2 = await seedTenant('aa');
    await expectPgCode(
      () =>
        db.execute(sql`
          INSERT INTO human_reviews (tenant_id, conversation_id, status)
          VALUES (${t1.tenantId}::uuid, ${t2.conversationId}::uuid, 'pending')
        `),
      '23503',
      'human_reviews_tenant_id_conversation_id_fk',
    );
  });

  it('I-2 failure: human_reviews referencing cross-tenant message rejected (23503)', async () => {
    const t1 = await seedTenant('bb');
    const t2 = await seedTenant('cc');
    await db.execute(sql`
      INSERT INTO messages (tenant_id, conversation_id, whatsapp_channel_id, external_message_id, from_source, body)
      VALUES (${t2.tenantId}::uuid, ${t2.conversationId}::uuid, ${t2.channelId}::uuid, 'm-cc', 'user', 'hi')
    `);
    const msgRows = await db.execute<Row>(
      sql`SELECT id FROM messages WHERE external_message_id = 'm-cc'`,
    );
    const messageId = expectRow(msgRows[0], 'message').id;

    await expectPgCode(
      () =>
        db.execute(sql`
          INSERT INTO human_reviews (tenant_id, message_id, status)
          VALUES (${t1.tenantId}::uuid, ${messageId}::uuid, 'pending')
        `),
      '23503',
      'human_reviews_tenant_id_message_id_fk',
    );
  });

  // I-2 — successes: composite FK with one nullable column skipped when
  // child side is NULL.

  it('I-2 success: human_reviews with both nullable parents NULL is allowed', async () => {
    const t = await seedTenant('dd');
    await db.execute(sql`
      INSERT INTO human_reviews (tenant_id, conversation_id, message_id, status)
      VALUES (${t.tenantId}::uuid, NULL, NULL, 'pending')
    `);
    const rows = await db.execute<{ n: number }>(
      sql`SELECT COUNT(*)::int AS n FROM human_reviews WHERE tenant_id = ${t.tenantId}::uuid`,
    );
    expect(rows[0]?.n).toBe(1);
  });

  it('I-2 success: two conversations with intake_id NULL in the same tenant are allowed', async () => {
    const t = await seedTenantNoConv('ee');
    for (let i = 0; i < 2; i++) {
      await db.execute(sql`
        INSERT INTO conversations (tenant_id, contact_id, whatsapp_channel_id, intake_id, script_version)
        VALUES (${t.tenantId}::uuid, ${t.contactId}::uuid, ${t.channelId}::uuid, NULL, 'v1')
      `);
    }
    const rows = await db.execute<{ n: number }>(
      sql`SELECT COUNT(*)::int AS n FROM conversations WHERE tenant_id = ${t.tenantId}::uuid`,
    );
    expect(rows[0]?.n).toBe(2);
  });
});
