import { redirect, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { eq, or } from 'drizzle-orm';
import { getDb, createSession } from '~/lib/db/index.server';
import { users } from '~/lib/db/schema';
import { generateJWT, generateSessionToken } from '~/lib/.server/auth/auth.server';

export async function loader({ context, request }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const url = new URL(request.url);

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // User cancelled or error from Google
  if (error || !code) {
    return redirect('/?auth_error=cancelled');
  }

  // Verify CSRF state
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const cookieState = cookieHeader
    .split(';')
    .map((c) => c.trim().split('='))
    .find(([k]) => k === 'google_oauth_state')?.[1];

  if (!state || cookieState !== state) {
    return redirect('/?auth_error=invalid_state');
  }

  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return redirect('/?auth_error=not_configured');
  }

  const redirectUri = `${url.origin}/api/auth/google/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    console.error('Token exchange failed:', await tokenRes.text());
    return redirect('/?auth_error=token_failed');
  }

  const { access_token } = await tokenRes.json<{ access_token: string; id_token: string }>();

  // Get user info from Google
  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!userInfoRes.ok) {
    return redirect('/?auth_error=userinfo_failed');
  }

  const googleUser = await userInfoRes.json<{
    id: string;
    email: string;
    name: string;
    picture?: string;
  }>();

  const db = getDb(env);
  if (!db) {
    return redirect('/?auth_error=db_error');
  }

  // Find existing user by Google ID or email
  let [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.googleId, googleUser.id), eq(users.email, googleUser.email)))
    .limit(1);

  if (!user) {
    // Create new user — Google accounts are pre-verified
    const [created] = await db
      .insert(users)
      .values({
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.id,
        emailVerified: true,
      })
      .returning();
    user = created;
  } else {
    // Link Google ID if signing in via Google for the first time
    await db
      .update(users)
      .set({
        googleId: user.googleId ?? googleUser.id,
        emailVerified: true,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  }

  // Create session
  const sessionToken = generateSessionToken();
  await createSession(db, {
    userId: user.id,
    sessionToken,
    ipAddress: request.headers.get('cf-connecting-ip') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  });

  // Issue JWT
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    return redirect('/?auth_error=jwt_error');
  }

  const token = await generateJWT({ id: user.id, email: user.email, name: user.name }, jwtSecret);

  const headers = new Headers();
  // Clear state cookie
  headers.append('Set-Cookie', 'google_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  // Set session cookie
  headers.append(
    'Set-Cookie',
    `foil_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
  );

  return redirect('/', { headers });
}
