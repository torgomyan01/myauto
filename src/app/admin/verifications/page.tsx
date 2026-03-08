import { getVerificationsList } from '@/app/actions/admin/verifications';
import AdminVerificationsTable from '@/components/admin/AdminVerificationsTable';

export default async function AdminVerificationsPage() {
  const list = await getVerificationsList();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-800 mb-6">
        Проверка юридических лиц
      </h1>
      <AdminVerificationsTable list={list} />
    </div>
  );
}
