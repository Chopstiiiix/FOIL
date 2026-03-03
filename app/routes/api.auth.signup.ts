import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';
import { eq } from 'drizzle-orm';
import { getDb } from '~/lib/db/index.server';
import { users } from '~/lib/db/schema';
import { hashPassword, generateVerificationCode } from '~/lib/.server/auth/auth.server';
import { sendVerificationEmail } from '~/lib/.server/email/email.server';

export async function action({ context, request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { name, email, password, phone } = await request.json<{
      name: string;
      email: string;
      password: string;
      phone?: string;
    }>();

    if (!name || !email || !password) {
      return json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const env = context.cloudflare.env;
    const db = getDb(env);

    if (!db) {
      return json({ error: 'Database not configured' }, { status: 500 });
    }

    // Check if email already exists
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

    if (existing.length > 0) {
      return json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Hash password and generate verification code
    const passwordHash = await hashPassword(password);
    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Insert user
    await db.insert(users).values({
      email,
      name,
      passwordHash,
      phone: phone || null,
      emailVerified: false,
      verificationCode,
      verificationExpiry,
    });

    // Send verification email
    if (env.RESEND_API_KEY) {
      const emailResult = await sendVerificationEmail(env.RESEND_API_KEY, email, verificationCode);

      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
      }
    } else {
      console.warn('RESEND_API_KEY not configured, skipping verification email. Code:', verificationCode);
    }

    return json({ success: true });
  } catch (error) {
    console.error('Signup error:', error);
    return json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
