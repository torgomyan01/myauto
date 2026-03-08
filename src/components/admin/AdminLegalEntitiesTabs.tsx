'use client';

import { useState } from 'react';
import type { VerificationRow, UserOption } from '@/app/actions/admin/verifications';
import AdminVerificationsTable from './AdminVerificationsTable';
import AdminLegalEntityAddForm from './AdminLegalEntityAddForm';

interface AdminLegalEntitiesTabsProps {
  list: VerificationRow[];
  users: UserOption[];
}

type TabId = 'verify' | 'all' | 'add';

const tabs: { id: TabId; label: string }[] = [
  { id: 'verify', label: 'Проверить' },
  { id: 'all', label: 'Все' },
  { id: 'add', label: 'Добавить' },
];

export default function AdminLegalEntitiesTabs({ list, users }: AdminLegalEntitiesTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('verify');

  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-zinc-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-600 hover:text-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'verify' && (
        <AdminVerificationsTable list={list} showOnly="verify" />
      )}
      {activeTab === 'all' && (
        <AdminVerificationsTable list={list} showOnly="all" />
      )}
      {activeTab === 'add' && (
        <AdminLegalEntityAddForm users={users} />
      )}
    </div>
  );
}
