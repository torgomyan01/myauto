import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthSession } from '@/lib/auth-server';
import { getCurrentUserVerificationStatus } from '@/app/actions/legal-entity';
import MainTemplate from '@/components/layout/main-template/MainTemplate';
import { ROUTES } from '@/constants/routes';

export default async function AddPartPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect(ROUTES.LOGIN);
  }

  const { legalEntityVerified, pendingVerification } =
    await getCurrentUserVerificationStatus();

  if (!legalEntityVerified && !pendingVerification) {
    redirect(ROUTES.ADD_PART_VERIFY);
  }

  if (pendingVerification) {
    return (
      <MainTemplate>
        <div className="wrapper py-10 flex justify-center items-center mt-10!">
          <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-zinc-800 mb-2">
              Заявка на проверку
            </h1>
            <p className="text-zinc-600 text-sm mb-6">
              Ваши данные отправлены на верификацию. После подтверждения
              администратором вы сможете добавлять запчасти.
            </p>
            <Link
              href={ROUTES.HOME}
              className="inline-block rounded-lg bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              На главную
            </Link>
          </div>
        </div>
      </MainTemplate>
    );
  }

  return (
    <MainTemplate>
      <div className="wrapper py-10 mt-10!">
        <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-800 mb-2">
            Добавить запчасть
          </h1>
          <p className="text-zinc-600 text-sm">
            Форма добавления запчасти (здесь можно реализовать форму
            объявления).
          </p>
        </div>
      </div>
    </MainTemplate>
  );
}
