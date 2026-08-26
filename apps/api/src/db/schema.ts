// Tervox API — Stage 2 Drizzle schema (PostgreSQL).
//
// 14 tables per the Stage 2 brief. Multi-tenant via `tenantId` on every
// domain table; FKs cascade on tenant delete. Two named uniqueness
// invariants are explicit: `contacts (tenant_id, phone)` and
// `messages (whatsapp_channel_id, external_message_id)`. The roteiro
// (script) is hard-coded; only `scriptVersion` lives in the schema.
//
// Stage 2 hardening: every cross-tenant relation is enforced by a
// composite foreign key `(tenant_id, parent_id) → parent(tenant_id, id)`,
// and `conversations.intake_id` carries a partial unique index that
// allows at most one conversation per non-null intake. Both invariants
// are documented in apps/api/README.md.

import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const membershipRoleEnum = pgEnum('membership_role', ['member', 'admin', 'owner']);

export const messageFromSourceEnum = pgEnum('message_from_source', [
  'user',
  'bot',
  'human',
  'system',
]);

export const consentScopeEnum = pgEnum('consent_scope', [
  'data_processing',
  'lgpd_terms',
  'voice_recording',
]);

export const humanReviewStatusEnum = pgEnum('human_review_status', [
  'pending',
  'in_review',
  'resolved',
  'dismissed',
]);

const TIMESTAMP_DEFAULT = sql`now()`;

export const tenants = pgTable('tenants', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .default(TIMESTAMP_DEFAULT)
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .default(TIMESTAMP_DEFAULT)
    .notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  email: text('email').unique(),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .default(TIMESTAMP_DEFAULT)
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .default(TIMESTAMP_DEFAULT)
    .notNull(),
});

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: membershipRoleEnum('role').notNull().default('member'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
  },
  (table) => ({
    tenantUserUnique: uniqueIndex('memberships_tenant_id_user_id_unique').on(
      table.tenantId,
      table.userId,
    ),
    tenantIdIdx: index('memberships_tenant_id_idx').on(table.tenantId),
  }),
);

export const sessions = pgTable('sessions', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .default(TIMESTAMP_DEFAULT)
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .default(TIMESTAMP_DEFAULT)
    .notNull(),
});

export const whatsappChannels = pgTable(
  'whatsapp_channels',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    phoneNumberId: text('phone_number_id').notNull(),
    businessAccountId: text('business_account_id').notNull(),
    accessToken: text('access_token').notNull(),
    webhookVerifyToken: text('webhook_verify_token'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
  },
  (table) => ({
    tenantPhoneUnique: uniqueIndex('whatsapp_channels_tenant_id_phone_number_id_unique').on(
      table.tenantId,
      table.phoneNumberId,
    ),
    tenantIdIdx: index('whatsapp_channels_tenant_id_idx').on(table.tenantId),
  }),
);

export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    phone: text('phone').notNull(),
    name: text('name'),
    email: text('email'),
    optedOut: boolean('opted_out').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
  },
  (table) => ({
    tenantPhoneUnique: uniqueIndex('contacts_tenant_id_phone_unique').on(
      table.tenantId,
      table.phone,
    ),
    tenantIdIdx: index('contacts_tenant_id_idx').on(table.tenantId),
  }),
);

export const intakes = pgTable(
  'intakes',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    whatsappChannelId: uuid('whatsapp_channel_id')
      .notNull()
      .references(() => whatsappChannels.id, { onDelete: 'cascade' }),
    scriptVersion: text('script_version').notNull(),
    state: text('state').notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
  },
  (table) => ({
    tenantIdIdx: index('intakes_tenant_id_idx').on(table.tenantId),
    contactIdIdx: index('intakes_contact_id_idx').on(table.contactId),
    tenantIdContactIdFk: foreignKey({
      name: 'intakes_tenant_id_contact_id_fk',
      columns: [table.tenantId, table.contactId],
      foreignColumns: [contacts.tenantId, contacts.id],
    }).onDelete('cascade'),
    tenantIdWhatsappChannelIdFk: foreignKey({
      name: 'intakes_tenant_id_whatsapp_channel_id_fk',
      columns: [table.tenantId, table.whatsappChannelId],
      foreignColumns: [whatsappChannels.tenantId, whatsappChannels.id],
    }).onDelete('cascade'),
  }),
);

export const employmentContexts = pgTable(
  'employment_contexts',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    intakeId: uuid('intake_id')
      .notNull()
      .references(() => intakes.id, { onDelete: 'cascade' }),
    jobTitle: text('job_title').notNull(),
    salaryCents: integer('salary_cents'),
    admissionDate: date('admission_date'),
    contractType: text('contract_type'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
  },
  (table) => ({
    tenantIdIdx: index('employment_contexts_tenant_id_idx').on(table.tenantId),
    intakeIdIdx: index('employment_contexts_intake_id_idx').on(table.intakeId),
    tenantIdIntakeIdFk: foreignKey({
      name: 'employment_contexts_tenant_id_intake_id_fk',
      columns: [table.tenantId, table.intakeId],
      foreignColumns: [intakes.tenantId, intakes.id],
    }).onDelete('cascade'),
  }),
);

export const intakeIssues = pgTable(
  'intake_issues',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    intakeId: uuid('intake_id')
      .notNull()
      .references(() => intakes.id, { onDelete: 'cascade' }),
    issueType: text('issue_type').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
  },
  (table) => ({
    tenantIdIdx: index('intake_issues_tenant_id_idx').on(table.tenantId),
    intakeIdIdx: index('intake_issues_intake_id_idx').on(table.intakeId),
    tenantIdIntakeIdFk: foreignKey({
      name: 'intake_issues_tenant_id_intake_id_fk',
      columns: [table.tenantId, table.intakeId],
      foreignColumns: [intakes.tenantId, intakes.id],
    }).onDelete('cascade'),
  }),
);

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    whatsappChannelId: uuid('whatsapp_channel_id')
      .notNull()
      .references(() => whatsappChannels.id, { onDelete: 'cascade' }),
    intakeId: uuid('intake_id').references(() => intakes.id, {
      onDelete: 'set null',
    }),
    scriptVersion: text('script_version').notNull(),
    status: text('status').notNull().default('open'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
  },
  (table) => ({
    tenantIdIdx: index('conversations_tenant_id_idx').on(table.tenantId),
    contactIdIdx: index('conversations_contact_id_idx').on(table.contactId),
    intakeIdPartialUnique: uniqueIndex('conversations_intake_id_unique')
      .on(table.intakeId)
      .where(sql`${table.intakeId} IS NOT NULL`),
    tenantIdContactIdFk: foreignKey({
      name: 'conversations_tenant_id_contact_id_fk',
      columns: [table.tenantId, table.contactId],
      foreignColumns: [contacts.tenantId, contacts.id],
    }).onDelete('cascade'),
    tenantIdWhatsappChannelIdFk: foreignKey({
      name: 'conversations_tenant_id_whatsapp_channel_id_fk',
      columns: [table.tenantId, table.whatsappChannelId],
      foreignColumns: [whatsappChannels.tenantId, whatsappChannels.id],
    }).onDelete('cascade'),
    tenantIdIntakeIdFk: foreignKey({
      name: 'conversations_tenant_id_intake_id_fk',
      columns: [table.tenantId, table.intakeId],
      foreignColumns: [intakes.tenantId, intakes.id],
    }).onDelete('set null'),
  }),
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    whatsappChannelId: uuid('whatsapp_channel_id')
      .notNull()
      .references(() => whatsappChannels.id, { onDelete: 'cascade' }),
    externalMessageId: text('external_message_id').notNull(),
    fromSource: messageFromSourceEnum('from_source').notNull(),
    body: text('body').notNull(),
    // Self-referencing origin — soft FK only (no constraint). The table is
    // indexed on (conversation_id) so a reply always sits in the same
    // conversation and an idempotent insert can resolve the origin via a
    // SELECT. Soft FK keeps the constraint graph acyclic for fresh clones.
    originMessageId: uuid('origin_message_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
  },
  (table) => ({
    channelExternalUnique: uniqueIndex(
      'messages_whatsapp_channel_id_external_message_id_unique',
    ).on(table.whatsappChannelId, table.externalMessageId),
    tenantIdIdx: index('messages_tenant_id_idx').on(table.tenantId),
    conversationIdIdx: index('messages_conversation_id_idx').on(table.conversationId),
    originMessageIdIdx: index('messages_origin_message_id_idx').on(table.originMessageId),
    tenantIdConversationIdFk: foreignKey({
      name: 'messages_tenant_id_conversation_id_fk',
      columns: [table.tenantId, table.conversationId],
      foreignColumns: [conversations.tenantId, conversations.id],
    }).onDelete('cascade'),
    tenantIdWhatsappChannelIdFk: foreignKey({
      name: 'messages_tenant_id_whatsapp_channel_id_fk',
      columns: [table.tenantId, table.whatsappChannelId],
      foreignColumns: [whatsappChannels.tenantId, whatsappChannels.id],
    }).onDelete('cascade'),
  }),
);

export const consents = pgTable(
  'consents',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    whatsappChannelId: uuid('whatsapp_channel_id')
      .notNull()
      .references(() => whatsappChannels.id, { onDelete: 'cascade' }),
    scope: consentScopeEnum('scope').notNull(),
    granted: boolean('granted').notNull().default(true),
    grantedAt: timestamp('granted_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
    revokedAt: timestamp('revoked_at', {
      withTimezone: true,
      mode: 'date',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
  },
  (table) => ({
    contactChannelScopeUnique: uniqueIndex(
      'consents_contact_id_whatsapp_channel_id_scope_unique',
    ).on(table.contactId, table.whatsappChannelId, table.scope),
    tenantIdIdx: index('consents_tenant_id_idx').on(table.tenantId),
    tenantIdContactIdFk: foreignKey({
      name: 'consents_tenant_id_contact_id_fk',
      columns: [table.tenantId, table.contactId],
      foreignColumns: [contacts.tenantId, contacts.id],
    }).onDelete('cascade'),
    tenantIdWhatsappChannelIdFk: foreignKey({
      name: 'consents_tenant_id_whatsapp_channel_id_fk',
      columns: [table.tenantId, table.whatsappChannelId],
      foreignColumns: [whatsappChannels.tenantId, whatsappChannels.id],
    }).onDelete('cascade'),
  }),
);

export const triageAnswers = pgTable(
  'triage_answers',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    intakeId: uuid('intake_id')
      .notNull()
      .references(() => intakes.id, { onDelete: 'cascade' }),
    questionId: text('question_id').notNull(),
    answerPayload: jsonb('answer_payload').notNull(),
    selectedOptionId: text('selected_option_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
  },
  (table) => ({
    tenantIdIdx: index('triage_answers_tenant_id_idx').on(table.tenantId),
    intakeIdIdx: index('triage_answers_intake_id_idx').on(table.intakeId),
    tenantIdIntakeIdFk: foreignKey({
      name: 'triage_answers_tenant_id_intake_id_fk',
      columns: [table.tenantId, table.intakeId],
      foreignColumns: [intakes.tenantId, intakes.id],
    }).onDelete('cascade'),
  }),
);

export const humanReviews = pgTable(
  'human_reviews',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    conversationId: uuid('conversation_id').references(() => conversations.id, {
      onDelete: 'set null',
    }),
    messageId: uuid('message_id').references(() => messages.id, {
      onDelete: 'set null',
    }),
    status: humanReviewStatusEnum('status').notNull().default('pending'),
    outcome: text('outcome'),
    escalationTarget: text('escalation_target'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .default(TIMESTAMP_DEFAULT)
      .notNull(),
  },
  (table) => ({
    tenantIdIdx: index('human_reviews_tenant_id_idx').on(table.tenantId),
    tenantIdConversationIdFk: foreignKey({
      name: 'human_reviews_tenant_id_conversation_id_fk',
      columns: [table.tenantId, table.conversationId],
      foreignColumns: [conversations.tenantId, conversations.id],
    }).onDelete('set null'),
    tenantIdMessageIdFk: foreignKey({
      name: 'human_reviews_tenant_id_message_id_fk',
      columns: [table.tenantId, table.messageId],
      foreignColumns: [messages.tenantId, messages.id],
    }).onDelete('set null'),
  }),
);

export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type WhatsappChannel = typeof whatsappChannels.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Intake = typeof intakes.$inferSelect;
export type EmploymentContext = typeof employmentContexts.$inferSelect;
export type IntakeIssue = typeof intakeIssues.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Consent = typeof consents.$inferSelect;
export type TriageAnswer = typeof triageAnswers.$inferSelect;
export type HumanReview = typeof humanReviews.$inferSelect;
