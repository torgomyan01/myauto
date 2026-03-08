'use client';

import MainTemplate from '@/components/layout/main-template/MainTemplate';
import GroupParts from '@/components/brands/GroupParts';
import { ROUTES } from '@/constants/routes';
import { useRouter, useSearchParams } from 'next/navigation';

export default function BrandModelGroupPartsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const type = searchParams.get('type');
  const mark = searchParams.get('mark');
  const model = searchParams.get('model');
  const modification = searchParams.get('modification');
  const parentGroup = searchParams.get('parentGroup') ?? '';
  const group = searchParams.get('group');

  if (!type || !mark || !model || !group) {
    router.replace(ROUTES.BRANDS);
    return null;
  }

  return (
    <MainTemplate>
      <div className="wrapper py-8">
        <GroupParts
          type={type}
          mark={mark}
          modelId={model}
          modificationId={modification ?? ''}
          parentGroup={parentGroup}
          groupId={group}
        />
      </div>
    </MainTemplate>
  );
}

