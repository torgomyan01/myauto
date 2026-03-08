import { getVerificationsList, getUsersForLegalEntitySelect } from '@/app/actions/admin/verifications';
import AdminLegalEntitiesTabs from '@/components/admin/AdminLegalEntitiesTabs';

export default async function AdminLegalEntitiesPage() {
  const [list, users] = await Promise.all([
    getVerificationsList(),
    getUsersForLegalEntitySelect(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-800 mb-6">
        Ир. лица (юр. лица)
      </h1>
      <AdminLegalEntitiesTabs list={list} users={users} />
    </div>
  );
}
