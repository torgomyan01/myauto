'use server';

import { getAuthSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export interface ProfileUpdateResult {
  email: string;
  name: string;
  phone: string | null;
}

export async function updateProfile(data: {
  name: string;
  phone: string;
}): Promise<ProfileUpdateResult> {
  const session = await getAuthSession();

  if (!session?.user) {
    throw new Error('Не авторизован');
  }

  const userId = Number((session.user as { id: string }).id);
  const name = String(data.name ?? '').trim();
  const phone = String(data.phone ?? '').trim();

  if (!name || !phone) {
    throw new Error('Имя и телефон обязательны');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { name, phone },
  });

  return {
    email: updated.email,
    name: updated.name,
    phone: updated.phone,
  };
}
