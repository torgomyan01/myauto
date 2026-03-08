import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/** Typed getServerSession for App Router (returns Session | null) */
export async function getAuthSession(): Promise<Session | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getServerSession(authOptions as any) as Promise<Session | null>;
}
