import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let connection: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDb(env: { DATABASE_URL?: string }) {
  if (!env.DATABASE_URL) {
    console.warn('DATABASE_URL not configured, database features will be disabled');
    return null;
  }

  if (!connection) {
    connection = postgres(env.DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

  if (!db) {
    db = drizzle(connection, { schema });
  }

  return db;
}

// Session tracking
export async function createSession(
  db: ReturnType<typeof drizzle>,
  data: {
    userId: string;
    projectId?: string;
    sessionToken: string;
    ipAddress?: string;
    userAgent?: string;
  }
) {
  try {
    const [session] = await db
      .insert(schema.sessions)
      .values({
        userId: data.userId,
        projectId: data.projectId,
        sessionToken: data.sessionToken,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        actions: [],
      })
      .returning();
    return session;
  } catch (error) {
    console.error('Failed to create session:', error);
    return null;
  }
}

// Log user action
export async function logUserAction(
  db: ReturnType<typeof drizzle>,
  data: {
    userId: string;
    action: string;
    resource?: string;
    resourceId?: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
  }
) {
  try {
    await db.insert(schema.auditLogs).values({
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      changes: data.changes,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  } catch (error) {
    console.error('Failed to log user action:', error);
  }
}

// Log error
export async function logError(
  db: ReturnType<typeof drizzle>,
  data: {
    userId?: string;
    projectId?: string;
    sessionId?: string;
    errorType: string;
    message: string;
    stackTrace?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    metadata?: any;
  }
) {
  try {
    await db.insert(schema.errorLogs).values({
      userId: data.userId,
      projectId: data.projectId,
      sessionId: data.sessionId,
      errorType: data.errorType,
      message: data.message,
      stackTrace: data.stackTrace,
      severity: data.severity || 'medium',
      metadata: data.metadata,
    });
  } catch (error) {
    console.error('Failed to log error:', error);
  }
}

// Track API usage
export async function trackApiUsage(
  db: ReturnType<typeof drizzle>,
  data: {
    userId: string;
    projectId?: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    tokens?: number;
    cost?: number;
    metadata?: any;
  }
) {
  try {
    await db.insert(schema.apiUsage).values({
      userId: data.userId,
      projectId: data.projectId,
      endpoint: data.endpoint,
      method: data.method,
      statusCode: data.statusCode,
      responseTime: data.responseTime,
      tokens: data.tokens,
      cost: data.cost,
      metadata: data.metadata,
    });
  } catch (error) {
    console.error('Failed to track API usage:', error);
  }
}

// Get or create user
export async function getOrCreateUser(
  db: ReturnType<typeof drizzle>,
  data: {
    email: string;
    name?: string;
    githubId?: string;
    githubUsername?: string;
  }
) {
  try {
    // Check if user exists
    const existing = await db
      .select()
      .from(schema.users)
      .where(schema.users.email.eq(data.email))
      .limit(1);

    if (existing.length > 0) {
      // Update last login
      await db
        .update(schema.users)
        .set({ lastLoginAt: new Date() })
        .where(schema.users.id.eq(existing[0].id));
      return existing[0];
    }

    // Create new user
    const [user] = await db
      .insert(schema.users)
      .values({
        email: data.email,
        name: data.name,
        githubId: data.githubId,
        githubUsername: data.githubUsername,
        lastLoginAt: new Date(),
      })
      .returning();

    return user;
  } catch (error) {
    console.error('Failed to get or create user:', error);
    return null;
  }
}

// Save project
export async function saveProject(
  db: ReturnType<typeof drizzle>,
  data: {
    userId: string;
    name: string;
    description?: string;
    framework?: string;
    filesSnapshot?: any;
    dependencies?: any;
  }
) {
  try {
    const [project] = await db
      .insert(schema.projects)
      .values({
        userId: data.userId,
        name: data.name,
        description: data.description,
        framework: data.framework,
        filesSnapshot: data.filesSnapshot,
        dependencies: data.dependencies,
        lastAccessedAt: new Date(),
      })
      .returning();

    return project;
  } catch (error) {
    console.error('Failed to save project:', error);
    return null;
  }
}

// Update project
export async function updateProject(
  db: ReturnType<typeof drizzle>,
  projectId: string,
  data: {
    name?: string;
    description?: string;
    filesSnapshot?: any;
    dependencies?: any;
    status?: 'active' | 'archived' | 'deleted';
  }
) {
  try {
    const [project] = await db
      .update(schema.projects)
      .set({
        ...data,
        updatedAt: new Date(),
        lastAccessedAt: new Date(),
      })
      .where(schema.projects.id.eq(projectId))
      .returning();

    return project;
  } catch (error) {
    console.error('Failed to update project:', error);
    return null;
  }
}