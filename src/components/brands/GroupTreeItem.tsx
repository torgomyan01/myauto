import Link from 'next/link';
import type { Group } from './groupsTreeUtils';

interface GroupTreeItemProps {
  group: Group;
  level: number;
  parentId: string | number | null;
  buildPartsUrl: (g: Group, parentId: string | number | null) => string;
  isExpanded: (id: string) => boolean;
  onToggle: (id: string) => void;
  loadedSubGroups?: Record<string, Group[]>;
  loadingSubGroups?: Set<string>;
  onLoadSubGroups?: (groupId: string) => Promise<Group[] | void>;
  onSelectGroup?: (group: Group) => void;
  /** Id-ներ այն խմբերի, որոնք ընթացիկ path-ում են (աջ պանելի breadcrumb) — ցուցադրվում է active. */
  selectedPathIds?: Set<string>;
}

export default function GroupTreeItem({
  group,
  level,
  parentId,
  buildPartsUrl,
  isExpanded,
  onToggle,
  loadedSubGroups = {},
  loadingSubGroups = new Set(),
  onLoadSubGroups,
  onSelectGroup,
  selectedPathIds,
}: GroupTreeItemProps) {
  const idStr = String(group.id);
  const isActive = Boolean(selectedPathIds?.has(idStr));
  const hasSub = group.hasSubGroups || group.needLoadSubGroups;
  const loaded = loadedSubGroups[idStr];
  const effectiveSubGroups =
    Array.isArray(group.subGroups) && group.subGroups.length > 0
      ? group.subGroups
      : (loaded ?? []);
  const expanded = hasSub && isExpanded(idStr);
  const isLoading = loadingSubGroups.has(idStr);
  const partsUrl = buildPartsUrl(group, parentId);

  const handleExpandClick = () => {
    if (!hasSub) return;
    // Եթե ենթախմբեր չեն եկել և պետք է առանձին հարցում — նախ բեռնում, բացում միայն պատասխան ստանալուց հետո
    const needsLoad =
      group.needLoadSubGroups &&
      (!group.subGroups || group.subGroups.length === 0) &&
      !loaded &&
      onLoadSubGroups;
    if (needsLoad) {
      onLoadSubGroups(idStr)
        .then(() => onToggle(idStr))
        .catch(() => {});
      return;
    }
    onToggle(idStr);
  };

  return (
    <li className="list-none">
      <div
        className="flex flex-col gap-1"
        style={{ paddingLeft: level > 0 ? `${level * 16}px` : 0 }}
      >
        <div
          className={`flex items-center gap-2 py-1.5 rounded-lg group/item ${isActive ? 'bg-[#E21321]/10 border-l-2 border-[#E21321] pl-2 -ml-0.5' : 'hover:bg-slate-50/80'}`}
        >
          {hasSub ? (
            <button
              type="button"
              onClick={handleExpandClick}
              disabled={isLoading}
              className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-60"
              aria-expanded={expanded}
              aria-label={expanded ? 'Свернуть' : 'Развернуть'}
            >
              {isLoading ? (
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
              ) : (
                <span
                  className={`inline-block transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
                >
                  ‹
                </span>
              )}
            </button>
          ) : (
            <span className="w-6 shrink-0" aria-hidden />
          )}
          {group.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={group.image}
              alt=""
              className="h-20 w-25 rounded object-contain bg-white border border-gray-100 shrink-0"
            />
          )}
          <div
            className="flex-1 min-w-0 flex items-center gap-2 flex-wrap cursor-pointer"
            onClick={() => hasSub && onSelectGroup?.(group)}
            onKeyDown={(e) => {
              if (hasSub && onSelectGroup && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onSelectGroup(group);
              }
            }}
            role={hasSub ? 'button' : undefined}
            tabIndex={hasSub ? 0 : undefined}
          >
            {group.hasParts ? (
              <Link
                href={partsUrl}
                className="text-sm font-medium text-gray-900 hover:text-[#E21321] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {group.name}
              </Link>
            ) : (
              <span className="text-sm font-medium text-gray-700">
                {group.name}
              </span>
            )}
            {group.hasParts && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-[10px] font-medium text-emerald-600 px-1.5 py-[2px]">
                детали
              </span>
            )}
            {(hasSub || effectiveSubGroups.length > 0) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 text-[10px] font-medium text-sky-600 px-1.5 py-[2px]">
                подгруппы
              </span>
            )}
          </div>
        </div>
        {hasSub && expanded && effectiveSubGroups.length > 0 && (
          <ul className="border-l border-slate-200 ml-1 mt-0.5 flex flex-col gap-0">
            {effectiveSubGroups.map((sub) => (
              <GroupTreeItem
                key={String(sub.id)}
                group={sub}
                level={level + 1}
                parentId={group.id}
                buildPartsUrl={buildPartsUrl}
                isExpanded={isExpanded}
                onToggle={onToggle}
                loadedSubGroups={loadedSubGroups}
                loadingSubGroups={loadingSubGroups}
                onLoadSubGroups={onLoadSubGroups}
                onSelectGroup={onSelectGroup}
                selectedPathIds={selectedPathIds}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
