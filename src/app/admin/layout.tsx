import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth-server';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { ROUTES } from '@/constants/routes';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  if (!session) {
    redirect(`${ROUTES.LOGIN}?callbackUrl=${encodeURIComponent(ROUTES.ADMIN)}`);
  }
  if (!session.user) {
    redirect(`${ROUTES.LOGIN}?callbackUrl=${encodeURIComponent(ROUTES.ADMIN)}`);
  }

  if (session.user.role !== 'ADMIN') {
    redirect(ROUTES.HOME);
  }

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
