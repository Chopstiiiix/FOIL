import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export function getDb(env: { DATABASE_URL?: string }) {
  if (!env.DATABASE_URL) {
    console.warn('DATABASE_URL not configured, database features will be disabled');
    return null;
  }

  const sql = neon(env.DATABASE_URL);

  return drizzle(sql, { schema });
}

// Session tracking
export async function createSession(
  db: NonNullable<ReturnType<typeof getDb>>,
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
  db: NonNullable<ReturnType<typeof getDb>>,
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
  db: NonNullable<ReturnType<typeof getDb>>,
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
