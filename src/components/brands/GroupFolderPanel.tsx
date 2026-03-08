'use client';

import Link from 'next/link';
import type { Group } from './groupsTreeUtils';

export interface PathItem {
  group: Group;
  children: Group[];
}

interface GroupFolderPanelProps {
  path: PathItem[];
  buildPartsUrl: (g: Group, parentId: string | number | null) => string;
  onBreadcrumbClick: (index: number) => void;
  onOpenFolder: (folder: Group, parent: Group) => Promise<void>;
  onBeforeNavigateToParts?: (group: Group) => void;
  loadingSubGroups: Set<string>;
  activeGroupId?: string | null;
}

function FolderCard({
  group,
  parentId,
  parentGroup,
  buildPartsUrl,
  onOpenFolder,
  onBeforeNavigateToParts,
  isLoading,
  isActive,
}: {
  group: Group;
  parentId: string | number | null;
  parentGroup: Group;
  buildPartsUrl: (g: Group, parentId: string | number | null) => string;
  onOpenFolder: (folder: Group, parent: Group) => Promise<void>;
  onBeforeNavigateToParts?: (group: Group) => void;
  isLoading: boolean;
  isActive?: boolean;
}) {
  const hasSub = group.hasSubGroups || group.needLoadSubGroups;
  const partsUrl = buildPartsUrl(group, parentId);

  const handleClick = () => {
    if (!hasSub) return;
    onOpenFolder(group, parentGroup);
  };

  const handleOpenPartsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBeforeNavigateToParts?.(group);
  };

  return (
    <div
      className={`rounded-xl border p-4 shadow-sm transition-all flex flex-col items-center text-center min-w-[140px] ${
        isActive
          ? 'border-[#E21321] bg-red-50/50 shadow-[0_0_0_2px_rgba(226,19,33,0.15)]'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading || !hasSub}
        className="w-full flex flex-col items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#E21321]/30 rounded-lg"
      >
        {group.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={group.image}
            alt=""
            className="h-16 w-20 object-contain bg-slate-50 rounded-lg border border-slate-100"
          />
        ) : (
          <span
            className="h-16 w-20 flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 text-2xl"
            aria-hidden
          >
            📁
          </span>
        )}
        <span className="text-sm font-medium text-gray-800 line-clamp-2">
          {group.name}
        </span>
        <div className="flex flex-wrap gap-1 justify-center">
          {group.hasParts && (
            <span className="inline-flex rounded-full bg-emerald-50 text-[10px] font-medium text-emerald-600 px-1.5 py-[2px]">
              детали
            </span>
          )}
          {hasSub && (
            <span className="inline-flex rounded-full bg-sky-50 text-[10px] font-medium text-sky-600 px-1.5 py-[2px]">
              подгруппы
            </span>
          )}
        </div>
        {isLoading && (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
        )}
      </button>
      {group.hasParts && (
        <Link
          href={partsUrl}
          className="mt-2 text-xs text-[#E21321] hover:underline"
          onClick={handleOpenPartsClick}
        >
          Открыть детали
        </Link>
      )}
    </div>
  );
}

export default function GroupFolderPanel({
  path,
  buildPartsUrl,
  onBreadcrumbClick,
  onOpenFolder,
  onBeforeNavigateToParts,
  loadingSubGroups,
  activeGroupId,
}: GroupFolderPanelProps) {
  if (path.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
        <span className="text-4xl mb-3" aria-hidden>📂</span>
        <p className="text-sm text-slate-500">
          Выберите группу в дереве слева, чтобы увидеть подгруппы здесь.
        </p>
      </div>
    );
  }

  const current = path[path.length - 1];
  const parentId = path.length > 1 ? path[path.length - 2].group.id : null;

  const sortedChildren = [...current.children].sort((a, b) => {
    const aIsFolder = a.hasSubGroups || a.needLoadSubGroups;
    const bIsFolder = b.hasSubGroups || b.needLoadSubGroups;
    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;
    return (a.name ?? '').localeCompare(b.name ?? '', undefined, { sensitivity: 'base' });
  });

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex flex-wrap items-center gap-1 text-sm">
        {path.map((item, index) => {
          const isLast = index === path.length - 1;
          const isCurrentDetail = isLast && activeGroupId != null && String(item.group.id) === activeGroupId;
          return (
            <span key={String(item.group.id)} className="flex items-center gap-1">
              {index > 0 && <span className="text-slate-300">/</span>}
              <button
                type="button"
                onClick={() => onBreadcrumbClick(index)}
                className={
                  isCurrentDetail
                    ? 'text-[#E21321] font-semibold hover:underline'
                    : 'text-slate-600 hover:text-[#E21321] hover:underline font-medium'
                }
              >
                {item.group.name}
              </button>
              {isCurrentDetail && (
                <span className="inline-flex rounded-full bg-[#E21321]/15 text-[10px] font-medium text-[#E21321] px-1.5 py-[2px]">
                  детали
                </span>
              )}
            </span>
          );
        })}
      </nav>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {sortedChildren.map((child) => (
          <FolderCard
            key={String(child.id)}
            group={child}
            parentId={current.group.id}
            parentGroup={current.group}
            buildPartsUrl={buildPartsUrl}
            onOpenFolder={onOpenFolder}
            onBeforeNavigateToParts={onBeforeNavigateToParts}
            isLoading={loadingSubGroups.has(String(child.id))}
            isActive={activeGroupId != null && String(child.id) === activeGroupId}
          />
        ))}
      </div>
    </div>
  );
}
