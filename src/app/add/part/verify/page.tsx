import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth-server';
import { prisma } from '@/lib/prisma';
import MainTemplate from '@/components/layout/main-template/MainTemplate';
import LegalEntityVerifyForm from '@/components/add-part/LegalEntityVerifyForm';
import { ROUTES } from '@/constants/routes';

export default async function AddPartVerifyPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect(ROUTES.LOGIN);
  }

  const userId = Number(session.user.id);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { legalEntityVerified: true },
  });

  if (user?.legalEntityVerified) {
    redirect(ROUTES.ADD_PART);
  }

  return (
    <MainTemplate>
      <div className="wrapper py-10">
        <LegalEntityVerifyForm />
      </div>
    </MainTemplate>
  );
}
