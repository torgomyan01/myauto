'use client';

import MainTemplate from '@/components/layout/main-template/MainTemplate';
import BrandModels from '@/components/brands/BrandModels';
import { ROUTES } from '@/constants/routes';
import { useRouter, useSearchParams } from 'next/navigation';

export default function BrandModelsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mark = searchParams.get('mark');
  const name = searchParams.get('name');

  if (!mark) {
    router.replace(ROUTES.BRANDS);
    return null;
  }

  return (
    <MainTemplate>
      <div className="wrapper py-8">
        <BrandModels mark={mark} markName={name} />
      </div>
    </MainTemplate>
  );
}

