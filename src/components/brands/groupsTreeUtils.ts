export interface Group {
  id: string | number;
  parentId?: string | number | null;
  name: string;
  description?: string | null;
  image?: string | null;
  hasParts: boolean;
  hasSubGroups: boolean;
  needLoadSubGroups: boolean;
  subGroups?: Group[];
}

export function filterGroupTree(groups: Group[], query: string): Group[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;

  function filterOne(g: Group): Group | null {
    const nameMatch = g.name.toLowerCase().includes(q);
    const children = Array.isArray(g.subGroups) ? g.subGroups : [];
    const filteredChildren = children
      .map(filterOne)
      .filter((x): x is Group => x != null);
    if (nameMatch || filteredChildren.length > 0) {
      return {
        ...g,
        subGroups: filteredChildren.length > 0 ? filteredChildren : g.subGroups,
      };
    }
    return null;
  }

  return groups.map(filterOne).filter((x): x is Group => x != null);
}

export function collectAllIds(groups: Group[]): Set<string> {
  const set = new Set<string>();
  function walk(gs: Group[]) {
    gs.forEach((g) => {
      set.add(String(g.id));
      if (Array.isArray(g.subGroups) && g.subGroups.length) walk(g.subGroups);
    });
  }
  walk(groups);
  return set;
}

/** Оставляет в дереве только «осмысленные» группы: с деталями или с подгруппами (не пустые папки). */
export function filterToMeaningfulGroups(groups: Group[]): Group[] {
  return groups
    .map((g) => {
      const children = Array.isArray(g.subGroups)
        ? filterToMeaningfulGroups(g.subGroups)
        : [];
      const hasMeaningfulChildren = children.length > 0;
      const isMeaningful =
        g.hasParts ||
        g.hasSubGroups ||
        g.needLoadSubGroups ||
        hasMeaningfulChildren;
      if (!isMeaningful) return null;
      return {
        ...g,
        subGroups: children.length > 0 ? children : g.subGroups,
      } as Group;
    })
    .filter((x): x is Group => x != null);
}
