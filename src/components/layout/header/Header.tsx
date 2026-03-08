'use client';

import { useSession } from 'next-auth/react';
import HeaderClient from './HeaderClient';

export default function Header() {
  const { data: session } = useSession();
  return <HeaderClient session={session ?? null} />;
}
