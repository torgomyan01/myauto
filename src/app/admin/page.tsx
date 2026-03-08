import { getAuthSession } from '@/lib/auth-server';

export default async function AdminDashboardPage() {
  const session = await getAuthSession();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-800 mb-2">
        Админ-панель
      </h1>
      <p className="text-zinc-600 mb-6">
        Добро пожаловать, {session?.user?.name ?? session?.user?.email}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="font-medium text-zinc-800">Пользователи</h3>
          <p className="mt-1 text-sm text-zinc-500">Управление пользователями</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="font-medium text-zinc-800">Настройки</h3>
          <p className="mt-1 text-sm text-zinc-500">Общие настройки</p>
        </div>
      </div>
    </div>
  );
}
