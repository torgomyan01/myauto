import AdminAddPartForm from '@/components/admin/AdminAddPartForm';
import { getSpareCategoryOptions } from '@/app/actions/spare-categories';

export default async function AdminAddPartPage() {
  const categories = await getSpareCategoryOptions();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-zinc-800">
        Добавить запчасть
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Гибкая форма для создания карточки товара и предложений продавцов.
      </p>
      <AdminAddPartForm categories={categories} />
    </div>
  );
}
