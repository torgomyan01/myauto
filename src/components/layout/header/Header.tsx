'use client';

import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import HeaderClient from './HeaderClient';

export default function Header() {
  const { data: session } = useSession();
  return <HeaderClient session={(session ?? null) as Session | null} />;
}
