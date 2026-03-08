'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { getAuthSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

async function ensureAdmin() {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Доступ запрещён');
  }
  return session;
}

export type AdminUserRow = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: 'USER' | 'ADMIN';
  blocked: boolean;
  createdAt: Date;
};

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  await ensureAdmin();
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      blocked: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return users as AdminUserRow[];
}

export async function createAdminUser(data: {
  email: string;
  name: string;
  password: string;
  phone?: string;
  role?: 'USER' | 'ADMIN';
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureAdmin();

  const email = String(data.email ?? '').trim().toLowerCase();
  const name = String(data.name ?? '').trim();
  const password = String(data.password ?? '');
  const phone = data.phone ? String(data.phone).trim() || null : null;
  const role = data.role === 'ADMIN' ? 'ADMIN' : 'USER';

  if (!email || !name || !password) {
    return { ok: false, error: 'Заполните email, имя и пароль' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Неверный формат email' };
  }
  if (password.length < 6) {
    return { ok: false, error: 'Пароль не менее 6 символов' };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: 'Пользователь с таким email уже есть' };
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      phone,
      role,
      updatedAt: new Date(),
    },
  });

  revalidatePath('/admin/users');
  revalidatePath('/admin');
  return { ok: true };
}

export async function updateAdminUser(
  id: number,
  data: {
    name?: string;
    email?: string;
    phone?: string | null;
    role?: 'USER' | 'ADMIN';
    password?: string;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureAdmin();

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return { ok: false, error: 'Пользователь не найден' };
  }

  const name = data.name !== undefined ? String(data.name).trim() : user.name;
  const email = data.email !== undefined ? String(data.email).trim().toLowerCase() : user.email;
  const phone = data.phone !== undefined ? (data.phone ? String(data.phone).trim() || null : null) : user.phone;
  const role = data.role === 'ADMIN' ? 'ADMIN' : data.role === 'USER' ? 'USER' : user.role;

  if (!name || !email) {
    return { ok: false, error: 'Имя и email обязательны' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Неверный формат email' };
  }

  if (email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { ok: false, error: 'Пользователь с таким email уже есть' };
    }
  }

  const updateData: Parameters<typeof prisma.user.update>[0]['data'] = {
    name,
    email,
    phone,
    role,
    updatedAt: new Date(),
  };
  if (data.password && data.password.length >= 6) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  await prisma.user.update({
    where: { id },
    data: updateData,
  });

  revalidatePath('/admin/users');
  revalidatePath('/admin');
  return { ok: true };
}

export async function deleteAdminUser(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureAdmin();

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return { ok: false, error: 'Пользователь не найден' };
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath('/admin/users');
  revalidatePath('/admin');
  return { ok: true };
}

export async function setAdminUserBlocked(
  id: number,
  blocked: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureAdmin();

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return { ok: false, error: 'Пользователь не найден' };
  }

  await prisma.user.update({
    where: { id },
    data: { blocked, updatedAt: new Date() },
  });

  revalidatePath('/admin/users');
  revalidatePath('/admin');
  return { ok: true };
}
