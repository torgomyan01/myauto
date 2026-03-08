'use client';

import { HeroUIProvider } from '@heroui/react';
import { ToastProvider } from '@heroui/toast';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

interface ProvidersProps {
  children: React.ReactNode;
  session: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <HeroUIProvider>
          <ToastProvider
            toastProps={{
              radius: 'lg',
              timeout: 3000,
            }}
          />
          {children}
        </HeroUIProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
