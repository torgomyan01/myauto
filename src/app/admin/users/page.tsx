import { getAdminUsers } from '@/app/actions/admin/users';
import AdminUsersTable from '@/components/admin/AdminUsersTable';

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-800 mb-6">
        Пользователи
      </h1>
      <AdminUsersTable users={users} />
    </div>
  );
}
