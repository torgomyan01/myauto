import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import NextTopLoader from 'nextjs-toploader';
import { Providers } from './providers';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import './globals.scss';

export const metadata: Metadata = {
  title: 'MyAuto',
  description: 'MyAuto — автозапчасти',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="ru">
      <body>
        <NextTopLoader />
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
