import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateVerificationCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
}

export function generateSessionToken(): string {
  return crypto.randomUUID();
}

export async function generateJWT(
  user: { id: string; email: string; name: string | null },
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = encoder.encode(secret);

  return new SignJWT({ sub: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function verifyJWT(token: string, secret: string) {
  const encoder = new TextEncoder();
  const key = encoder.encode(secret);

  const { payload } = await jwtVerify(token, key);
  return payload as { sub: string; email: string; name: string | null };
}
