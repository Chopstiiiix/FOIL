import { redirect } from '@remix-run/cloudflare';

// Super admin GitHub usernames
const SUPER_ADMINS = ['Chopstiiiix', 'leeakpareva'];

export interface User {
  id: string;
  email: string;
  github_username?: string;
  role: 'user' | 'admin' | 'superadmin';
  subscription_tier: 'free' | 'pro' | 'enterprise';
}

/**
 * Check if user is an admin or superadmin
 * For now, this is a mock implementation - will be replaced with real auth
 */
export async function requireAdmin(request: Request, context: any): Promise<User> {
  // TODO: Implement real authentication with session checking
  // For now, return a mock superadmin user for development

  // In production, this would:
  // 1. Check session cookie
  // 2. Validate session in Redis/DB
  // 3. Check user role
  // 4. Redirect if not admin

  const mockUser: User = {
    id: 'mock-admin-id',
    email: 'admin@leeakpareva.dev',
    github_username: 'leeakpareva',
    role: 'superadmin',
    subscription_tier: 'enterprise',
  };

  // Check if user is superadmin
  if (SUPER_ADMINS.includes(mockUser.github_username || '')) {
    mockUser.role = 'superadmin';
  }

  // In production, redirect non-admins
  // if (mockUser.role !== 'admin' && mockUser.role !== 'superadmin') {
  //   throw redirect('/');
  // }

  return mockUser;
}

/**
 * Check if a GitHub username is a super admin
 */
export function isSuperAdmin(githubUsername: string | undefined): boolean {
  if (!githubUsername) return false;
  return SUPER_ADMINS.includes(githubUsername);
}

/**
 * Get user from session
 * TODO: Implement real session management
 */
export async function getUserFromSession(request: Request, context: any): Promise<User | null> {
  // This would normally:
  // 1. Get session cookie
  // 2. Look up session in Redis/DB
  // 3. Return user data

  return null;
}

/**
 * Create a new session for user
 * TODO: Implement real session creation
 */
export async function createSession(user: User, context: any): Promise<string> {
  // This would normally:
  // 1. Generate secure session token
  // 2. Store in Redis with expiry
  // 3. Return session token for cookie

  return 'mock-session-token';
}

/**
 * Destroy user session
 * TODO: Implement real session destruction
 */
export async function destroySession(sessionToken: string, context: any): Promise<void> {
  // This would normally:
  // 1. Remove session from Redis
  // 2. Optionally log the logout event
}