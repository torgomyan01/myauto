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
  loadingSubGroups: Set<string>;
}

function FolderCard({
  group,
  parentId,
  parentGroup,
  buildPartsUrl,
  onOpenFolder,
  isLoading,
}: {
  group: Group;
  parentId: string | number | null;
  parentGroup: Group;
  buildPartsUrl: (g: Group, parentId: string | number | null) => string;
  onOpenFolder: (folder: Group, parent: Group) => Promise<void>;
  isLoading: boolean;
}) {
  const hasSub = group.hasSubGroups || group.needLoadSubGroups;
  const partsUrl = buildPartsUrl(group, parentId);

  const handleClick = () => {
    if (!hasSub) return;
    onOpenFolder(group, parentGroup);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex flex-col items-center text-center min-w-[140px]">
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
          onClick={(e) => e.stopPropagation()}
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
  loadingSubGroups,
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

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex flex-wrap items-center gap-1 text-sm">
        {path.map((item, index) => (
          <span key={String(item.group.id)} className="flex items-center gap-1">
            {index > 0 && <span className="text-slate-300">/</span>}
            <button
              type="button"
              onClick={() => onBreadcrumbClick(index)}
              className="text-slate-600 hover:text-[#E21321] hover:underline font-medium"
            >
              {item.group.name}
            </button>
          </span>
        ))}
      </nav>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {current.children.map((child) => (
          <FolderCard
            key={String(child.id)}
            group={child}
            parentId={current.group.id}
            parentGroup={current.group}
            buildPartsUrl={buildPartsUrl}
            onOpenFolder={onOpenFolder}
            isLoading={loadingSubGroups.has(String(child.id))}
          />
        ))}
      </div>
    </div>
  );
}
