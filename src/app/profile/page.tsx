import MainTemplate from '@/components/layout/main-template/MainTemplate';
import ProfileForm, {
  type ProfileData,
} from '@/components/account/profile/ProfileForm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }

  const userId = Number((session.user as any).id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const data: ProfileData = {
    email: user.email,
    name: user.name,
    phone: user.phone,
  };

  return (
    <MainTemplate>
      <div className="wrapper py-8 flex justify-center">
        <ProfileForm initialData={data} />
      </div>
    </MainTemplate>
  );
}