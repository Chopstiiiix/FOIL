import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';
import { eq } from 'drizzle-orm';
import { getDb } from '~/lib/db/index.server';
import { users } from '~/lib/db/schema';
import { verifyPassword, generateJWT, generateSessionToken } from '~/lib/.server/auth/auth.server';
import { createSession } from '~/lib/db/index.server';

export async function action({ context, request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { email, password } = await request.json<{ email: string; password: string }>();

    if (!email || !password) {
      return json({ error: 'Email and password are required' }, { status: 400 });
    }

    const env = context.cloudflare.env;
    const db = getDb(env);

    if (!db) {
      return json({ error: 'Database not configured' }, { status: 500 });
    }

    // Look up user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password
    if (!user.passwordHash) {
      return json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      return json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check email verification
    if (!user.emailVerified) {
      return json({ error: 'Please verify your email before signing in' }, { status: 403 });
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Create session
    const sessionToken = generateSessionToken();
    await createSession(db, {
      userId: user.id,
      sessionToken,
      ipAddress: request.headers.get('cf-connecting-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Generate JWT
    const jwtSecret = env.JWT_SECRET;

    if (!jwtSecret) {
      return json({ error: 'JWT secret not configured' }, { status: 500 });
    }

    const token = await generateJWT({ id: user.id, email: user.email, name: user.name }, jwtSecret);

    // Set HTTP-only cookie with JWT
    const headers = new Headers();
    headers.append(
      'Set-Cookie',
      `foil_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
    );

    return json(
      { success: true, user: { id: user.id, email: user.email, name: user.name } },
      { headers },
    );
  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
