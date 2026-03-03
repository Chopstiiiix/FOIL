import { redirect, type LoaderFunctionArgs } from '@remix-run/cloudflare';

export async function loader({ context, request }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const clientId = env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Response('Google OAuth not configured', { status: 501 });
  }

  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/google/callback`;

  // Random state for CSRF protection
  const state = crypto.randomUUID();

  const googleUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleUrl.searchParams.set('client_id', clientId);
  googleUrl.searchParams.set('redirect_uri', redirectUri);
  googleUrl.searchParams.set('response_type', 'code');
  googleUrl.searchParams.set('scope', 'openid email profile');
  googleUrl.searchParams.set('state', state);
  googleUrl.searchParams.set('access_type', 'online');
  googleUrl.searchParams.set('prompt', 'select_account');

  const headers = new Headers();
  headers.append(
    'Set-Cookie',
    `google_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
  );

  return redirect(googleUrl.toString(), { headers });
}
