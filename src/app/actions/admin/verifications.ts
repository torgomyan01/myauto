'use server';

import { revalidatePath } from 'next/cache';
import { getAuthSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { ROUTES } from '@/constants/routes';
import { createNotificationForUser } from '@/app/actions/notifications';

async function ensureAdmin(): Promise<{ user: { id: string; role: string }; [key: string]: unknown }> {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Доступ запрещён');
  }
  return session as unknown as { user: { id: string; role: string }; [key: string]: unknown };
}

export type VerificationRow = {
  id: number;
  userId: number;
  userEmail: string;
  userName: string;
  companyName: string;
  taxId: string;
  legalAddress: string;
  paymentProofPath: string | null;
  paymentProofData: string | null;
  amount: number;
  status: string;
  submittedAt: Date;
  reviewedAt: Date | null;
  rejectionReason: string | null;
};

export async function getVerificationsList(status?: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<VerificationRow[]> {
  await ensureAdmin();

  const where = status ? { status } : {};
  const list = await prisma.legalEntityVerification.findMany({
    where,
    include: {
      user: { select: { email: true, name: true } },
    },
    orderBy: { submittedAt: 'desc' },
  });

  return list.map((v) => ({
    id: v.id,
    userId: v.userId,
    userEmail: v.user.email,
    userName: v.user.name,
    companyName: v.companyName,
    taxId: v.taxId,
    legalAddress: v.legalAddress,
    paymentProofPath: v.paymentProofPath,
    paymentProofData: v.paymentProofData,
    amount: v.amount,
    status: v.status,
    submittedAt: v.submittedAt,
    reviewedAt: v.reviewedAt,
    rejectionReason: v.rejectionReason,
  }));
}

export async function approveVerification(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await ensureAdmin();
  const adminId = Number(session.user.id);

  const verification = await prisma.legalEntityVerification.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!verification) return { ok: false, error: 'Заявка не найдена' };
  if (verification.status !== 'PENDING') {
    return { ok: false, error: 'Заявка уже обработана' };
  }

  await prisma.$transaction([
    prisma.legalEntityVerification.update({
      where: { id },
      data: { status: 'APPROVED', reviewedAt: new Date(), reviewedByUserId: adminId },
    }),
    prisma.user.update({
      where: { id: verification.userId },
      data: { legalEntityVerified: true },
    }),
  ]);

  await createNotificationForUser({
    userId: verification.userId,
    status: 'success',
    title: 'Юридическое лицо подтверждено',
    message: `Ваша организация "${verification.companyName}" успешно верифицирована.`,
    href: ROUTES.ADD_PART,
  });

  revalidatePath(ROUTES.ADMIN_VERIFICATIONS);
  revalidatePath(ROUTES.ADMIN_LEGAL_ENTITIES);
  revalidatePath(ROUTES.ADMIN);
  return { ok: true };
}

export async function rejectVerification(
  id: number,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await ensureAdmin();
  const adminId = Number(session.user.id);

  const verification = await prisma.legalEntityVerification.findUnique({
    where: { id },
  });
  if (!verification) return { ok: false, error: 'Заявка не найдена' };
  if (verification.status !== 'PENDING') {
    return { ok: false, error: 'Заявка уже обработана' };
  }

  await prisma.legalEntityVerification.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectionReason: reason.slice(0, 512),
      reviewedAt: new Date(),
      reviewedByUserId: adminId,
    },
  });

  await createNotificationForUser({
    userId: verification.userId,
    status: 'warning',
    title: 'Заявка на верификацию отклонена',
    message: reason || 'Пожалуйста, исправьте данные и отправьте заявку повторно.',
    href: ROUTES.ADD_PART,
  });

  revalidatePath(ROUTES.ADMIN_VERIFICATIONS);
  revalidatePath(ROUTES.ADMIN_LEGAL_ENTITIES);
  revalidatePath(ROUTES.ADMIN);
  return { ok: true };
}

export async function blockUserAndVerification(
  id: number,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await ensureAdmin();
  const adminId = Number(session.user.id);

  const verification = await prisma.legalEntityVerification.findUnique({
    where: { id },
  });
  if (!verification) return { ok: false, error: 'Заявка не найдена' };

  await prisma.$transaction([
    prisma.legalEntityVerification.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason.slice(0, 512),
        reviewedAt: new Date(),
        reviewedByUserId: adminId,
      },
    }),
    prisma.user.update({
      where: { id: verification.userId },
      data: { blocked: true },
    }),
  ]);

  await createNotificationForUser({
    userId: verification.userId,
    status: 'error',
    title: 'Ваша учетная запись заблокирована',
    message:
      reason ||
      'Ваша учетная запись заблокирована администрацией. Пожалуйста, свяжитесь с поддержкой.',
    href: ROUTES.CONTACTS,
  });

  revalidatePath(ROUTES.ADMIN_VERIFICATIONS);
  revalidatePath(ROUTES.ADMIN_LEGAL_ENTITIES);
  revalidatePath(ROUTES.ADMIN);
  return { ok: true };
}

export type UserOption = { id: number; name: string; email: string };

export async function getUsersForLegalEntitySelect(): Promise<UserOption[]> {
  await ensureAdmin();
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });
  return users.map((u) => ({ id: u.id, name: u.name, email: u.email }));
}

export async function searchUsersForLegalEntity(
  query: string,
  limit: number = 10
): Promise<UserOption[]> {
  await ensureAdmin();
  const q = String(query ?? '').trim();
  if (q === '') {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return users.map((u) => ({ id: u.id, name: u.name, email: u.email }));
  }
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { email: { contains: q } },
      ],
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
    take: limit,
  });
  return users.map((u) => ({ id: u.id, name: u.name, email: u.email }));
}

export async function createLegalEntityByAdmin(data: {
  userId: number;
  companyName: string;
  taxId: string;
  legalAddress: string;
  paymentProofPath?: string | null;
  approveImmediately: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await ensureAdmin();
  const adminId = Number(session.user.id);

  const companyName = String(data.companyName ?? '').trim();
  const taxId = String(data.taxId ?? '').trim();
  const legalAddress = String(data.legalAddress ?? '').trim();
  if (!companyName || !taxId || !legalAddress) {
    return { ok: false, error: 'Заполните организацию, ИНН и адрес' };
  }

  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) return { ok: false, error: 'Пользователь не найден' };

  const status = data.approveImmediately ? 'APPROVED' : 'PENDING';
  const reviewedAt = data.approveImmediately ? new Date() : null;
  const reviewedByUserId = data.approveImmediately ? adminId : null;

  await prisma.$transaction(async (tx) => {
    await tx.legalEntityVerification.create({
      data: {
        userId: data.userId,
        companyName,
        taxId,
        legalAddress,
        paymentProofPath: data.paymentProofPath || null,
        amount: 1000,
        status,
        reviewedAt,
        reviewedByUserId,
      },
    });
    if (data.approveImmediately) {
      await tx.user.update({
        where: { id: data.userId },
        data: { legalEntityVerified: true },
      });
    }
  });

  revalidatePath(ROUTES.ADMIN_VERIFICATIONS);
  revalidatePath(ROUTES.ADMIN_LEGAL_ENTITIES);
  revalidatePath(ROUTES.ADMIN);
  return { ok: true };
}
