'use server';

import { revalidatePath } from 'next/cache';
import { getAuthSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import { ROUTES } from '@/constants/routes';

export async function submitLegalEntityVerification(data: {
  companyName: string;
  taxId: string;
  legalAddress: string;
  paymentProofPath?: string | null;
  paymentProofBase64?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: 'Войдите в аккаунт' };
  }

  const userId = Number(session.user.id);
  const companyName = String(data.companyName ?? '').trim();
  const taxId = String(data.taxId ?? '').trim();
  const legalAddress = String(data.legalAddress ?? '').trim();

  if (!companyName || !taxId || !legalAddress) {
    return { ok: false, error: 'Заполните все поля' };
  }

  const hasProof = (data.paymentProofPath && (data.paymentProofPath.startsWith('/uploads/') || data.paymentProofPath.startsWith('/api/uploads/'))) || (data.paymentProofBase64 && data.paymentProofBase64.startsWith('data:'));
  if (!hasProof) {
    return { ok: false, error: 'Прикрепите чек об оплате 1000 драм (перевод на наш банковский счёт)' };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: 'Пользователь не найден' };
  if (user.legalEntityVerified) {
    return { ok: false, error: 'Вы уже верифицированы' };
  }

  await prisma.legalEntityVerification.create({
    data: {
      userId,
      companyName,
      taxId,
      legalAddress,
      paymentProofPath: data.paymentProofPath || null,
      paymentProofData: data.paymentProofBase64 || null,
      amount: 1000,
      status: 'PENDING',
    },
  });

  revalidatePath(ROUTES.ADD_PART_VERIFY);
  revalidatePath(ROUTES.ADD_PART);
  return { ok: true };
}

export async function getCurrentUserVerificationStatus(): Promise<{
  legalEntityVerified: boolean;
  pendingVerification: boolean;
}> {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return { legalEntityVerified: false, pendingVerification: false };
  }

  const userId = Number(session.user.id);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { legalEntityVerified: true },
  });
  if (!user) return { legalEntityVerified: false, pendingVerification: false };

  if (user.legalEntityVerified) {
    return { legalEntityVerified: true, pendingVerification: false };
  }

  const pending = await prisma.legalEntityVerification.findFirst({
    where: { userId, status: 'PENDING' },
  });
  return {
    legalEntityVerified: false,
    pendingVerification: !!pending,
  };
}
