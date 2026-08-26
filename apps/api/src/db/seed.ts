// Idempotent dev seed for the Tervox API schema.
//
// Run with `npm run db:seed`. Re-running inserts ZERO new rows — every
// model is resolved via deterministic lookup before any insert, so the
// script is safe to invoke against a database that's already seeded.
//
// Order matters because of FK relationships between inserted rows:
//   tenants → users → whatsappChannels → contacts →
//   intakes → employmentContexts / intakeIssues →
//   conversations → messages / consents /
//   triageAnswers / humanReviews.
import { sql } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import { db } from './client.js';
import {
  consents,
  contacts,
  conversations,
  employmentContexts,
  humanReviews,
  intakeIssues,
  intakes,
  memberships,
  messages,
  tenants,
  triageAnswers,
  users,
  whatsappChannels,
} from './schema.js';

const SCRIPT_VERSION = 'v0.1.0';

export async function seed(): Promise<void> {
  logger.info('starting dev seed');

  // -- tenant ---------------------------------------------------------
  const existingTenantRows = await db
    .select()
    .from(tenants)
    .where(sql`${tenants.slug} = 'acme-demo'`)
    .limit(1);
  const tenant =
    existingTenantRows[0] ??
    (await db.insert(tenants).values({ name: 'Acme Demo', slug: 'acme-demo' }).returning())[0];
  if (!tenant) throw new Error('tenant insert returned no rows');

  // -- user -----------------------------------------------------------
  const existingUserRows = await db
    .select()
    .from(users)
    .where(sql`${users.email} = 'demo@acme.example'`)
    .limit(1);
  const user =
    existingUserRows[0] ??
    (
      await db.insert(users).values({ email: 'demo@acme.example', name: 'Demo User' }).returning()
    )[0];
  if (!user) throw new Error('user insert returned no rows');

  // -- membership -----------------------------------------------------
  const existingMembershipRows = await db
    .select()
    .from(memberships)
    .where(sql`${memberships.tenantId} = ${tenant.id} AND ${memberships.userId} = ${user.id}`)
    .limit(1);
  if (!existingMembershipRows[0]) {
    await db.insert(memberships).values({
      tenantId: tenant.id,
      userId: user.id,
      role: 'owner',
    });
  }

  // -- whatsapp channel ----------------------------------------------
  const existingChannelRows = await db
    .select()
    .from(whatsappChannels)
    .where(
      sql`${whatsappChannels.tenantId} = ${tenant.id} AND ${whatsappChannels.phoneNumberId} = 'demo-phone-id'`,
    )
    .limit(1);
  const channel =
    existingChannelRows[0] ??
    (
      await db
        .insert(whatsappChannels)
        .values({
          tenantId: tenant.id,
          phoneNumberId: 'demo-phone-id',
          businessAccountId: 'demo-business-id',
          accessToken: 'demo-access-token-not-for-production',
          isActive: true,
        })
        .returning()
    )[0];
  if (!channel) throw new Error('whatsapp channel insert returned no rows');

  // -- contacts -------------------------------------------------------
  const existingAliceRows = await db
    .select()
    .from(contacts)
    .where(sql`${contacts.tenantId} = ${tenant.id} AND ${contacts.phone} = '+5511999990001'`)
    .limit(1);
  const alice =
    existingAliceRows[0] ??
    (
      await db
        .insert(contacts)
        .values({
          tenantId: tenant.id,
          phone: '+5511999990001',
          name: 'Alice Demo',
        })
        .returning()
    )[0];
  if (!alice) throw new Error('alice contact insert returned no rows');

  const existingBobRows = await db
    .select()
    .from(contacts)
    .where(sql`${contacts.tenantId} = ${tenant.id} AND ${contacts.phone} = '+5511999990002'`)
    .limit(1);
  const bob =
    existingBobRows[0] ??
    (
      await db
        .insert(contacts)
        .values({
          tenantId: tenant.id,
          phone: '+5511999990002',
          name: 'Bob Demo',
        })
        .returning()
    )[0];
  if (!bob) throw new Error('bob contact insert returned no rows');

  // -- intake ---------------------------------------------------------
  const existingIntakeRows = await db
    .select()
    .from(intakes)
    .where(
      sql`${intakes.tenantId} = ${tenant.id}
          AND ${intakes.contactId} = ${alice.id}
          AND ${intakes.whatsappChannelId} = ${channel.id}
          AND ${intakes.scriptVersion} = ${SCRIPT_VERSION}`,
    )
    .limit(1);
  const intake =
    existingIntakeRows[0] ??
    (
      await db
        .insert(intakes)
        .values({
          tenantId: tenant.id,
          contactId: alice.id,
          whatsappChannelId: channel.id,
          scriptVersion: SCRIPT_VERSION,
          state: 'open',
        })
        .returning()
    )[0];
  if (!intake) throw new Error('intake insert returned no rows');

  // -- employment context + intake issues ----------------------------
  const existingCtxRows = await db
    .select()
    .from(employmentContexts)
    .where(
      sql`${employmentContexts.tenantId} = ${tenant.id} AND ${employmentContexts.intakeId} = ${intake.id}`,
    )
    .limit(1);
  if (!existingCtxRows[0]) {
    await db.insert(employmentContexts).values({
      tenantId: tenant.id,
      intakeId: intake.id,
      jobTitle: 'Analista',
      salaryCents: 500_000,
      admissionDate: '2022-01-15',
      contractType: 'clt',
    });
  }

  const existingIssuesRows = await db
    .select()
    .from(intakeIssues)
    .where(sql`${intakeIssues.tenantId} = ${tenant.id} AND ${intakeIssues.intakeId} = ${intake.id}`)
    .limit(1);
  if (!existingIssuesRows[0]) {
    await db.insert(intakeIssues).values([
      {
        tenantId: tenant.id,
        intakeId: intake.id,
        issueType: 'overtime',
        description: 'Horas extras nao pagas',
      },
      {
        tenantId: tenant.id,
        intakeId: intake.id,
        issueType: 'firing',
        description: 'Demissao sem aviso previo',
      },
    ]);
  }

  // -- conversation ---------------------------------------------------
  const existingConvRows = await db
    .select()
    .from(conversations)
    .where(
      sql`${conversations.tenantId} = ${tenant.id}
          AND ${conversations.contactId} = ${alice.id}
          AND ${conversations.whatsappChannelId} = ${channel.id}
          AND ${conversations.intakeId} = ${intake.id}`,
    )
    .limit(1);
  const conversation =
    existingConvRows[0] ??
    (
      await db
        .insert(conversations)
        .values({
          tenantId: tenant.id,
          contactId: alice.id,
          whatsappChannelId: channel.id,
          intakeId: intake.id,
          scriptVersion: SCRIPT_VERSION,
          status: 'open',
        })
        .returning()
    )[0];
  if (!conversation) throw new Error('conversation insert returned no rows');

  // -- messages -------------------------------------------------------
  await insertMessageIfMissing({
    tenantId: tenant.id,
    conversationId: conversation.id,
    channelId: channel.id,
    externalMessageId: 'wamid.demo-001',
    source: 'user',
    body: 'Ola, preciso de ajuda',
  });
  await insertMessageIfMissing({
    tenantId: tenant.id,
    conversationId: conversation.id,
    channelId: channel.id,
    externalMessageId: 'wamid.demo-002',
    source: 'bot',
    body: 'Ola! Como posso ajudar?',
  });
  await insertMessageIfMissing({
    tenantId: tenant.id,
    conversationId: conversation.id,
    channelId: channel.id,
    externalMessageId: 'wamid.demo-003',
    source: 'user',
    body: 'Tenho duvida sobre horas extras',
  });

  // -- consents -------------------------------------------------------
  await insertConsentIfMissing({
    tenantId: tenant.id,
    contactId: alice.id,
    channelId: channel.id,
    scope: 'data_processing',
  });
  await insertConsentIfMissing({
    tenantId: tenant.id,
    contactId: alice.id,
    channelId: channel.id,
    scope: 'lgpd_terms',
  });

  // -- triage answer + human review ----------------------------------
  await insertTriageIfMissing({
    tenantId: tenant.id,
    intakeId: intake.id,
    questionId: 'q1_employment_status',
    answerPayload: { value: 'employed' },
    selectedOptionId: 'opt_employed_clt',
  });
  await insertHumanReviewIfMissing({
    tenantId: tenant.id,
    conversationId: conversation.id,
  });

  logger.info(
    {
      tenantId: tenant.id,
      contactIds: [alice.id, bob.id],
      intakeId: intake.id,
      conversationId: conversation.id,
    },
    'dev seed complete',
  );
}

type SeedMessage = {
  tenantId: string;
  conversationId: string;
  channelId: string;
  externalMessageId: string;
  source: 'user' | 'bot' | 'human' | 'system';
  body: string;
};

async function insertMessageIfMissing(m: SeedMessage): Promise<void> {
  const existing = await db
    .select()
    .from(messages)
    .where(
      sql`${messages.whatsappChannelId} = ${m.channelId}
          AND ${messages.externalMessageId} = ${m.externalMessageId}`,
    )
    .limit(1);
  if (existing[0]) return;
  await db.insert(messages).values({
    tenantId: m.tenantId,
    conversationId: m.conversationId,
    whatsappChannelId: m.channelId,
    externalMessageId: m.externalMessageId,
    fromSource: m.source,
    body: m.body,
  });
}

type SeedConsent = {
  tenantId: string;
  contactId: string;
  channelId: string;
  scope: 'data_processing' | 'lgpd_terms' | 'voice_recording';
};

async function insertConsentIfMissing(c: SeedConsent): Promise<void> {
  const existing = await db
    .select()
    .from(consents)
    .where(
      sql`${consents.contactId} = ${c.contactId}
          AND ${consents.whatsappChannelId} = ${c.channelId}
          AND ${consents.scope} = ${c.scope}`,
    )
    .limit(1);
  if (existing[0]) return;
  await db.insert(consents).values({
    tenantId: c.tenantId,
    contactId: c.contactId,
    whatsappChannelId: c.channelId,
    scope: c.scope,
    granted: true,
  });
}

type SeedTriage = {
  tenantId: string;
  intakeId: string;
  questionId: string;
  answerPayload: Record<string, unknown>;
  selectedOptionId: string;
};

async function insertTriageIfMissing(t: SeedTriage): Promise<void> {
  const existing = await db
    .select()
    .from(triageAnswers)
    .where(
      sql`${triageAnswers.tenantId} = ${t.tenantId}
          AND ${triageAnswers.intakeId} = ${t.intakeId}
          AND ${triageAnswers.questionId} = ${t.questionId}`,
    )
    .limit(1);
  if (existing[0]) return;
  await db.insert(triageAnswers).values({
    tenantId: t.tenantId,
    intakeId: t.intakeId,
    questionId: t.questionId,
    answerPayload: t.answerPayload,
    selectedOptionId: t.selectedOptionId,
  });
}

type SeedHumanReview = {
  tenantId: string;
  conversationId: string;
};

async function insertHumanReviewIfMissing(h: SeedHumanReview): Promise<void> {
  const existing = await db
    .select()
    .from(humanReviews)
    .where(
      sql`${humanReviews.tenantId} = ${h.tenantId}
          AND ${humanReviews.conversationId} = ${h.conversationId}`,
    )
    .limit(1);
  if (existing[0]) return;
  await db.insert(humanReviews).values({
    tenantId: h.tenantId,
    conversationId: h.conversationId,
    status: 'pending',
    escalationTarget: 'lawyer@example.com',
  });
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((err: unknown) => {
    logger.error({ err }, 'seed failed');
    process.exit(1);
  });
