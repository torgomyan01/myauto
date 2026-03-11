'use server';

import { getAuthSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';

export type NotificationStatus = 'success' | 'warning' | 'error';

export async function createNotificationForUser(params: {
  userId: number;
  status: NotificationStatus;
  title: string;
  message: string;
  href?: string;
  image?: string;
}) {
  const session = await getAuthSession();
  // Допускаем отправку уведомлений только от авторизованных пользователей (например, админов)
  if (!session?.user) {
    throw new Error('Неавторизованный запрос на создание уведомления');
  }

  const status = params.status;
  if (!['success', 'warning', 'error'].includes(status)) {
    throw new Error('Недопустимый статус уведомления');
  }

  await prisma.notification.create({
    data: {
      userId: params.userId,
      status,
      title: params.title.slice(0, 255),
      message: params.message.slice(0, 1024),
      href: params.href?.slice(0, 512),
      image: params.image?.slice(0, 512),
    },
  });
}

export async function getMyNotifications() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return [];
  }

  const userId = Number(session.user.id);

  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return rows.map((n) => ({
    id: n.id,
    status: n.status,
    title: n.title,
    message: n.message,
    href: n.href,
    image: n.image,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function markMyNotificationsReadAll() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    throw new Error('Неавторизованный запрос');
  }

  const userId = Number(session.user.id);

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function markMyNotificationRead(id: number) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    throw new Error('Неавторизованный запрос');
  }

  const userId = Number(session.user.id);

  await prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
}


