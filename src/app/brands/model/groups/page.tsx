'use client';

import MainTemplate from '@/components/layout/main-template/MainTemplate';
import ModelGroups from '@/components/brands/ModelGroups';
import { ROUTES } from '@/constants/routes';
import { useRouter, useSearchParams } from 'next/navigation';

export default function BrandModelGroupsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = searchParams.get('type');
  const mark = searchParams.get('mark');
  const model = searchParams.get('model');
  const modification = searchParams.get('modification');
  const name = searchParams.get('name');

  if (!type || !mark || !model || !modification) {
    router.replace(ROUTES.BRANDS);
    return null;
  }

  return (
    <MainTemplate>
      <div className="wrapper py-8">
        <ModelGroups
          type={type}
          mark={mark}
          modelId={model}
          modificationId={modification}
          modificationName={name}
        />
      </div>
    </MainTemplate>
  );
}

