import { pgTable, serial, text, timestamp, integer, boolean, jsonb, varchar, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  githubId: text('github_id'),
  githubUsername: text('github_username'),
  role: text('role', { enum: ['user', 'admin', 'superadmin'] }).default('user'),
  tier: text('tier', { enum: ['free', 'pro', 'enterprise'] }).default('free'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
  metadata: jsonb('metadata'),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
  githubIdIdx: index('github_id_idx').on(table.githubId),
}));

// Projects table
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  framework: text('framework'),
  status: text('status', { enum: ['active', 'archived', 'deleted'] }).default('active'),
  filesSnapshot: jsonb('files_snapshot'),
  dependencies: jsonb('dependencies'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastAccessedAt: timestamp('last_accessed_at'),
  metadata: jsonb('metadata'),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  statusIdx: index('status_idx').on(table.status),
}));

// Sessions table for user activity tracking
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  projectId: uuid('project_id').references(() => projects.id),
  sessionToken: text('session_token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  duration: integer('duration'),
  actions: jsonb('actions'),
  metadata: jsonb('metadata'),
}, (table) => ({
  userIdIdx: index('session_user_id_idx').on(table.userId),
  projectIdIdx: index('session_project_id_idx').on(table.projectId),
  tokenIdx: index('session_token_idx').on(table.sessionToken),
}));

// Error logs table
export const errorLogs = pgTable('error_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  projectId: uuid('project_id').references(() => projects.id),
  sessionId: uuid('session_id').references(() => sessions.id),
  errorType: text('error_type').notNull(),
  message: text('message').notNull(),
  stackTrace: text('stack_trace'),
  severity: text('severity', { enum: ['low', 'medium', 'high', 'critical'] }).default('medium'),
  status: text('status', { enum: ['unresolved', 'investigating', 'resolved'] }).default('unresolved'),
  occurredAt: timestamp('occurred_at').defaultNow(),
  resolvedAt: timestamp('resolved_at'),
  metadata: jsonb('metadata'),
}, (table) => ({
  userIdIdx: index('error_user_id_idx').on(table.userId),
  projectIdIdx: index('error_project_id_idx').on(table.projectId),
  severityIdx: index('error_severity_idx').on(table.severity),
  statusIdx: index('error_status_idx').on(table.status),
}));

// API usage tracking
export const apiUsage = pgTable('api_usage', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  projectId: uuid('project_id').references(() => projects.id),
  endpoint: text('endpoint').notNull(),
  method: text('method').notNull(),
  statusCode: integer('status_code'),
  responseTime: integer('response_time'),
  tokens: integer('tokens'),
  cost: integer('cost'),
  timestamp: timestamp('timestamp').defaultNow(),
  metadata: jsonb('metadata'),
}, (table) => ({
  userIdIdx: index('api_user_id_idx').on(table.userId),
  timestampIdx: index('api_timestamp_idx').on(table.timestamp),
}));

// Deployments table
export const deployments = pgTable('deployments', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').references(() => projects.id),
  userId: uuid('user_id').references(() => users.id),
  provider: text('provider', { enum: ['vercel', 'netlify', 'cloudflare', 'github-pages'] }),
  status: text('status', { enum: ['pending', 'building', 'success', 'failed'] }).default('pending'),
  url: text('url'),
  buildLog: text('build_log'),
  deployedAt: timestamp('deployed_at').defaultNow(),
  metadata: jsonb('metadata'),
}, (table) => ({
  projectIdIdx: index('deploy_project_id_idx').on(table.projectId),
  userIdIdx: index('deploy_user_id_idx').on(table.userId),
  statusIdx: index('deploy_status_idx').on(table.status),
}));

// Audit logs for compliance
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  resource: text('resource'),
  resourceId: text('resource_id'),
  changes: jsonb('changes'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow(),
  metadata: jsonb('metadata'),
}, (table) => ({
  userIdIdx: index('audit_user_id_idx').on(table.userId),
  timestampIdx: index('audit_timestamp_idx').on(table.timestamp),
  actionIdx: index('audit_action_idx').on(table.action),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  sessions: many(sessions),
  errorLogs: many(errorLogs),
  apiUsage: many(apiUsage),
  deployments: many(deployments),
  auditLogs: many(auditLogs),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  sessions: many(sessions),
  errorLogs: many(errorLogs),
  apiUsage: many(apiUsage),
  deployments: many(deployments),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [sessions.projectId],
    references: [projects.id],
  }),
  errorLogs: many(errorLogs),
}));

export const errorLogsRelations = relations(errorLogs, ({ one }) => ({
  user: one(users, {
    fields: [errorLogs.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [errorLogs.projectId],
    references: [projects.id],
  }),
  session: one(sessions, {
    fields: [errorLogs.sessionId],
    references: [sessions.id],
  }),
}));

export const apiUsageRelations = relations(apiUsage, ({ one }) => ({
  user: one(users, {
    fields: [apiUsage.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [apiUsage.projectId],
    references: [projects.id],
  }),
}));

export const deploymentsRelations = relations(deployments, ({ one }) => ({
  project: one(projects, {
    fields: [deployments.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [deployments.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));