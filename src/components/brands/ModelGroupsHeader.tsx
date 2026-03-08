interface ModelGroupsHeaderProps {
  markImage?: string | null;
  markName?: string;
  modelName?: string;
  modificationName?: string;
}

export default function ModelGroupsHeader({
  markImage,
  markName,
  modelName,
  modificationName,
}: ModelGroupsHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {markImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={markImage}
          alt={markName ?? ''}
          className="h-10 w-10 rounded-full bg-white border border-gray-200 object-contain p-1"
        />
      )}
      <div className="min-w-0">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
          Схемы и группы деталей
        </h2>
        <p className="mt-0.5 text-xs md:text-sm text-gray-500">
          Модель: {modelName ?? '—'} · Модификация: {modificationName ?? '—'}
        </p>
      </div>
    </div>
  );
}
