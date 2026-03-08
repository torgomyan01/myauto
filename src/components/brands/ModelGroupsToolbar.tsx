interface ModelGroupsToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export default function ModelGroupsToolbar({
  searchQuery,
  onSearchChange,
  onExpandAll,
  onCollapseAll,
}: ModelGroupsToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="relative flex-1 max-w-md">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <i className="fa-solid fa-magnifying-glass text-sm" aria-hidden />
        </span>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Поиск по группам…"
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#E21321] focus:ring-1 focus:ring-[#E21321]/40 transition-colors"
          aria-label="Поиск по группам"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="Очистить поиск"
          >
            <i className="fa-solid fa-xmark text-xs" aria-hidden />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExpandAll}
          className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          Развернуть все
        </button>
        <button
          type="button"
          onClick={onCollapseAll}
          className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          Свернуть все
        </button>
      </div>
    </div>
  );
}
