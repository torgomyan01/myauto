'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ROUTES } from '@/constants/routes';
import { getAcatGroups } from '@/app/actions/acat';
import {
  type Group,
  filterGroupTree,
  collectAllIds,
  filterToMeaningfulGroups,
} from './groupsTreeUtils';
import ModelGroupsHeader from './ModelGroupsHeader';
import ModelGroupsToolbar from './ModelGroupsToolbar';
import GroupTreeItem from './GroupTreeItem';
import GroupFolderPanel from './GroupFolderPanel';

const STORAGE_KEY_PREFIX = 'model-groups-state';

function getStorageKey(
  type: string,
  mark: string,
  modelId: string,
  modificationId: string
): string {
  return `${STORAGE_KEY_PREFIX}-${type}-${mark}-${modelId}-${modificationId}`;
}

interface SavedModelGroupsState {
  expandedIds: string[];
  selectedPathIds: string[];
}

function loadState(key: string): SavedModelGroupsState | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as SavedModelGroupsState;
  } catch {
    return null;
  }
}

function saveState(key: string, state: SavedModelGroupsState) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // ignore
  }
}

interface ModelGroupsProps {
  type: string;
  mark: string;
  modelId: string;
  modificationId: string;
  modificationName?: string | null;
}

interface GroupsResponse {
  type?: { id: string; name: string };
  mark?: { id: string; name: string; image?: string };
  model?: { id: string; name: string; years?: string; image?: string };
  modification?: { id: string; name: string; description?: string };
  group?: string;
  groups?: Group[];
  subGroups?: Group[];
}

async function getGroups(
  type: string,
  mark: string,
  model: string,
  modification: string,
  groupId?: string
): Promise<GroupsResponse> {
  return getAcatGroups({
    type,
    mark,
    model,
    modification,
    group: groupId,
  }) as Promise<GroupsResponse>;
}

/** Нормализует ответ /catalogs/groups в массив групп (для корня или для group=id). */
function normalizeGroupsResponse(data: GroupsResponse | null): Group[] {
  if (!data) return [];
  if (Array.isArray(data.groups) && data.groups.length > 0) return data.groups;
  if (Array.isArray((data as GroupsResponse).subGroups))
    return (data as GroupsResponse).subGroups!;
  return [];
}

export default function ModelGroups({
  type,
  mark,
  modelId,
  modificationId,
  modificationName,
}: ModelGroupsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [loadedSubGroups, setLoadedSubGroups] = useState<Record<string, Group[]>>({});
  const [loadingSubGroups, setLoadingSubGroups] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<{ group: Group; children: Group[] }[]>([]);
  const initialExpandDone = useRef(false);
  const savedPathIdsToRestore = useRef<string[] | null>(null);
  const loadSubGroupsRef = useRef<(groupId: string) => Promise<Group[]>>(
    () => Promise.resolve([])
  );
  const storageKey = getStorageKey(type, mark, modelId, modificationId);

  function getEffectiveChildren(g: Group): Group[] {
    if (Array.isArray(g.subGroups) && g.subGroups.length > 0) return g.subGroups;
    return loadedSubGroups[String(g.id)] ?? [];
  }

  const enabled = Boolean(type && mark && modelId && modificationId);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['model-groups', type, mark, modelId, modificationId],
    queryFn: () => getGroups(type, mark, modelId, modificationId),
    enabled,
  });

  const topGroups: Group[] = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data.groups)
      ? data.groups
      : Array.isArray((data as GroupsResponse).subGroups)
        ? [
            {
              ...(data as unknown as Group),
              subGroups: (data as GroupsResponse).subGroups,
            },
          ]
        : [];
  }, [data]);

  const meaningfulTopGroups = useMemo(
    () => filterToMeaningfulGroups(topGroups),
    [topGroups]
  );

  const filteredTree = useMemo(
    () => filterGroupTree(meaningfulTopGroups, searchQuery),
    [meaningfulTopGroups, searchQuery]
  );

  const expandedForSearch = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return collectAllIds(filteredTree);
  }, [filteredTree, searchQuery]);

  const selectedPathIds = useMemo(
    () => new Set(selectedPath.map((p) => String(p.group.id))),
    [selectedPath]
  );

  useEffect(() => {
    if (meaningfulTopGroups.length === 0) return;
    const saved = loadState(storageKey);
    if (saved) {
      if (saved.expandedIds?.length) {
        setExpandedIds(new Set(saved.expandedIds));
      }
      if (saved.selectedPathIds?.length) {
        savedPathIdsToRestore.current = saved.selectedPathIds;
      }
    }
    if (!initialExpandDone.current) {
      if (!saved?.expandedIds?.length) {
        setExpandedIds(new Set(meaningfulTopGroups.map((g) => String(g.id))));
      }
      initialExpandDone.current = true;
    }
  }, [meaningfulTopGroups, storageKey]);

  useEffect(() => {
    if (meaningfulTopGroups.length === 0 || !savedPathIdsToRestore.current?.length)
      return;
    const pathIds = savedPathIdsToRestore.current;
    savedPathIdsToRestore.current = null;
    let cancelled = false;
    (async () => {
      const path: { group: Group; children: Group[] }[] = [];
      let currentLevel = meaningfulTopGroups;
      const loadSubGroups = loadSubGroupsRef.current;
      for (const id of pathIds) {
        if (cancelled) break;
        const g = currentLevel.find((x) => String(x.id) === id);
        if (!g) break;
        let children = getEffectiveChildren(g);
        if (g.needLoadSubGroups && children.length === 0 && loadSubGroups) {
          children = await loadSubGroups(String(g.id));
        }
        path.push({ group: g, children });
        currentLevel = children;
      }
      if (!cancelled && path.length > 0) setSelectedPath(path);
    })();
    return () => {
      cancelled = true;
    };
  }, [meaningfulTopGroups]);

  useEffect(() => {
    if (!storageKey) return;
    saveState(storageKey, {
      expandedIds: Array.from(expandedIds),
      selectedPathIds: selectedPath.map((p) => String(p.group.id)),
    });
  }, [storageKey, expandedIds, selectedPath]);

  if (!type || !mark || !modelId || !modificationId) {
    return (
      <div className="mt-6 text-sm text-red-500">
        Не заданы параметры модификации. Попробуйте выбрать модификацию из
        списка.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-6 text-sm text-gray-500">
        Загружаем схемы и группы деталей…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mt-6 text-sm text-red-500">
        Не удалось загрузить схемы. Попробуйте позже.
      </div>
    );
  }

  const titleModName = modificationName ?? data.modification?.name ?? '';
  const typeVal = data.type?.id ?? type;
  const markVal = data.mark?.id ?? mark;
  const modelVal = data.model?.id ?? modelId;
  const modificationVal = data.modification?.id ?? modificationId;

  const isExpanded = (id: string) =>
    expandedForSearch !== null
      ? expandedForSearch.has(id)
      : expandedIds.has(id);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(collectAllIds(meaningfulTopGroups));
  const collapseAll = () => setExpandedIds(new Set());

  async function loadSubGroups(groupId: string): Promise<Group[]> {
    if (loadedSubGroups[groupId] != null) return loadedSubGroups[groupId]!;
    setLoadingSubGroups((prev) => new Set(prev).add(groupId));
    try {
      const res = await getGroups(typeVal, markVal, modelVal, modificationVal, groupId);
      const list = normalizeGroupsResponse(res as GroupsResponse);
      const meaningful = filterToMeaningfulGroups(list);
      setLoadedSubGroups((prev) => ({ ...prev, [groupId]: meaningful }));
      return meaningful;
    } finally {
      setLoadingSubGroups((prev) => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
    }
  }
  loadSubGroupsRef.current = loadSubGroups;

  function buildPartsUrl(g: Group, parentId: string | number | null) {
    const parentGroupId =
      parentId === undefined || parentId === null ? 'null' : String(parentId);
    return `${ROUTES.BRAND_MODEL_PARTS}?type=${encodeURIComponent(typeVal)}&mark=${encodeURIComponent(markVal)}&model=${encodeURIComponent(modelVal)}&modification=${encodeURIComponent(modificationVal || 'null')}&parentGroup=${encodeURIComponent(parentGroupId)}&group=${encodeURIComponent(String(g.id))}&name=${encodeURIComponent(g.name ?? '')}`;
  }

  async function handleSelectGroupFromTree(group: Group) {
    const children = getEffectiveChildren(group);
    if (group.needLoadSubGroups && children.length === 0) {
      const list = await loadSubGroups(String(group.id));
      setSelectedPath([{ group: { ...group, subGroups: list }, children: list }]);
      return;
    }
    setSelectedPath([{ group, children }]);
  }

  function handleBreadcrumbClick(index: number) {
    setSelectedPath((prev) => prev.slice(0, index + 1));
  }

  async function handleOpenFolderInPanel(
    folder: Group,
    _parentInPath: Group
  ): Promise<void> {
    let children = getEffectiveChildren(folder);
    if (folder.needLoadSubGroups && children.length === 0) {
      children = await loadSubGroups(String(folder.id));
    }
    setSelectedPath((prev) => [...prev, { group: folder, children }]);
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <ModelGroupsHeader
          markImage={data.mark?.image}
          markName={data.mark?.name}
          modelName={data.model?.name}
          modificationName={titleModName}
        />

        <ModelGroupsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onExpandAll={expandAll}
          onCollapseAll={collapseAll}
        />
      </div>

      {meaningfulTopGroups.length === 0 ? (
        <p className="text-sm text-gray-500">
          Для этой модификации пока нет доступных групп/схем.
        </p>
      ) : filteredTree.length === 0 ? (
        <p className="text-sm text-gray-500">
          По запросу «{searchQuery}» ничего не найдено. Измените поиск или{' '}
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-[#E21321] hover:underline"
          >
            очистите фильтр
          </button>
          .
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <ul className="flex flex-col gap-0.5 min-w-0">
            {filteredTree.map((group) => (
              <GroupTreeItem
                key={String(group.id)}
                group={group}
                level={0}
                parentId={group.parentId ?? null}
                buildPartsUrl={buildPartsUrl}
                isExpanded={isExpanded}
                onToggle={toggleExpanded}
                loadedSubGroups={loadedSubGroups}
                loadingSubGroups={loadingSubGroups}
                onLoadSubGroups={loadSubGroups}
                onSelectGroup={handleSelectGroupFromTree}
                selectedPathIds={selectedPathIds}
              />
            ))}
          </ul>
          <div className="min-w-0">
            <GroupFolderPanel
              path={selectedPath}
              buildPartsUrl={buildPartsUrl}
              onBreadcrumbClick={handleBreadcrumbClick}
              onOpenFolder={handleOpenFolderInPanel}
              loadingSubGroups={loadingSubGroups}
            />
          </div>
        </div>
      )}
    </div>
  );
}
