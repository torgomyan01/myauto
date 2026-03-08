import type { Metadata } from 'next';
import NextTopLoader from 'nextjs-toploader';
import { Providers } from './providers';
import { getAuthSession } from '@/lib/auth-server';
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
  const session = await getAuthSession();

  return (
    <html lang="ru">
      <body>
        <NextTopLoader />
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
