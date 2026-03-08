'use client';

import MainTemplate from '@/components/layout/main-template/MainTemplate';
import ModelModifications from '@/components/brands/ModelModifications';
import { ROUTES } from '@/constants/routes';
import { useRouter, useSearchParams } from 'next/navigation';

export default function BrandModelModsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = searchParams.get('type');
  const mark = searchParams.get('mark');
  const model = searchParams.get('model');
  const name = searchParams.get('name');

  if (!type || !mark || !model) {
    router.replace(ROUTES.BRANDS);
    return null;
  }

  return (
    <MainTemplate>
      <div className="wrapper py-8">
        <ModelModifications
          type={type}
          mark={mark}
          modelId={model}
          modelName={name}
        />
      </div>
    </MainTemplate>
  );
}

