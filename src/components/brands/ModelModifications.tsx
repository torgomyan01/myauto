'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { getAcatModifications } from '@/app/actions/acat';

interface ModelModificationsProps {
  type: string;
  mark: string;
  modelId: string;
  modelName?: string | null;
}

interface ModificationParameter {
  key: string;
  name: string;
  value: string;
  idx: string;
  sortOrder?: number;
}

interface Modification {
  id: string;
  name: string;
  description?: string | null;
  modelImg?: string | null;
  parameters?: ModificationParameter[];
}

function getParamValue(mod: Modification, paramKey: string): string {
  const p = mod.parameters?.find((x) => x.key === paramKey);
  return p?.value ?? '';
}

function getSortedParams(
  parameters: ModificationParameter[]
): ModificationParameter[] {
  return [...parameters].sort(
    (a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)
  );
}

/** Порядок и ключи фильтров по параметрам (как в каталоге) */
const FILTER_SLOTS: { key: string; label: string }[] = [
  { key: 'year', label: 'Год' },
  { key: 'sales_region', label: 'Регион' },
  { key: 'steering', label: 'Рулевое управление' },
  { key: 'body_type', label: 'Тип кузова' },
  { key: 'trans_type', label: 'Тип коробки передач' },
  { key: 'car_name', label: 'Модель' },
  { key: 'spec_series', label: 'Серия' },
  { key: 'engine', label: 'Двигатель' },
];

interface ModificationsResponse {
  type: {
    id: string;
    name: string;
  };
  mark: {
    id: string;
    name: string;
    image?: string;
  };
  model: {
    id: string;
    name: string;
    years?: string;
    image?: string;
    archival?: boolean;
  };
  modifications: Modification[];
}

async function getModifications(
  type: string,
  mark: string,
  model: string
): Promise<ModificationsResponse> {
  const data = await getAcatModifications({ type, mark, model, lang: 'ru' });
  return data as ModificationsResponse;
}

export default function ModelModifications({
  type,
  mark,
  modelId,
  modelName,
}: ModelModificationsProps) {
  // Сразу валидируем входные параметры, до любых хуков
  if (!type || !mark || !modelId) {
    return (
      <div className="mt-6 text-sm text-red-500">
        Не заданы параметры модели. Попробуйте выбрать модель из списка.
      </div>
    );
  }

  const enabled = true;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['model-mods', type, mark, modelId],
    queryFn: () => getModifications(type, mark, modelId),
    enabled,
  });

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'relevance' | 'name-asc' | 'name-desc'>(
    'relevance'
  );
  const [onlyWithParams, setOnlyWithParams] = useState(false);
  const [paramFilters, setParamFilters] = useState<Record<string, string>>({});

  const mods = data?.modifications ?? [];

  /** По каждому слоту — уникальные значения (для опций в select) */
  const filterOptionsByKey = useMemo(() => {
    const map: Record<string, string[]> = {};
    FILTER_SLOTS.forEach(({ key }) => {
      const values = new Set<string>();
      mods.forEach((m) => {
        const v = getParamValue(m, key);
        if (v) values.add(v);
      });
      map[key] = Array.from(values).sort((a, b) =>
        a.localeCompare(b, 'ru-RU', { sensitivity: 'base' })
      );
    });
    return map;
  }, [mods]);

  const setFilter = (key: string, value: string) => {
    setParamFilters((prev) => ({ ...prev, [key]: value }));
  };

  const filteredSortedMods = useMemo(() => {
    let list = [...mods];

    FILTER_SLOTS.forEach(({ key }) => {
      const selected = paramFilters[key];
      if (selected) {
        list = list.filter((m) => getParamValue(m, key) === selected);
      }
    });

    if (onlyWithParams) {
      list = list.filter((m) => m.parameters && m.parameters.length > 0);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((m) => {
        const inName = m.name.toLowerCase().includes(q);
        const inDesc = m.description?.toLowerCase().includes(q) ?? false;
        const inParams =
          m.parameters?.some(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.value.toLowerCase().includes(q)
          ) ?? false;
        return inName || inDesc || inParams;
      });
    }

    if (sort === 'name-asc') {
      list.sort((a, b) =>
        a.name.localeCompare(b.name, 'ru-RU', { sensitivity: 'base' })
      );
    } else if (sort === 'name-desc') {
      list.sort((a, b) =>
        b.name.localeCompare(a.name, 'ru-RU', { sensitivity: 'base' })
      );
    }

    return list;
  }, [mods, search, sort, onlyWithParams, paramFilters]);

  const titleModelName = modelName ?? data?.model?.name ?? modelId;

  if (isLoading) {
    return (
      <div className="mt-6 text-sm text-gray-500">
        Загружаем модификации модели…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mt-6 text-sm text-red-500">
        Не удалось загрузить модификации. Попробуйте позже.
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          {data.mark?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.mark.image}
              alt={data.mark.name}
              className="h-10 w-10 rounded-full bg-white border border-gray-200 object-contain p-1"
            />
          )}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
              Модификации {titleModelName}
            </h2>
            <p className="mt-0.5 text-xs md:text-sm text-gray-500">
              Марка: {data.mark?.name} · Тип: {data.type?.name}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              placeholder="Поиск по названию и параметрам"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3.5 pr-9 text-xs md:text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#E21321] focus:ring-1 focus:ring-[#E21321]/40 transition-colors"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
              <i className="fa-solid fa-magnifying-glass" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] md:text-xs text-gray-500 shrink-0">
              Сортировка:
            </label>
            <select
              value={sort}
              onChange={(e) =>
                setSort(
                  e.target.value as 'relevance' | 'name-asc' | 'name-desc'
                )
              }
              className="h-9 min-w-[140px] rounded-xl border border-gray-200 bg-white px-2 text-[11px] md:text-xs text-gray-800 outline-none focus:border-[#E21321] focus:ring-1 focus:ring-[#E21321]/40 transition-colors"
            >
              <option value="relevance">По умолчанию</option>
              <option value="name-asc">По названию (А–Я)</option>
              <option value="name-desc">По названию (Я–А)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setOnlyWithParams((v) => !v)}
            className={`inline-flex items-center gap-1.5 h-9 rounded-xl border px-3 text-[11px] md:text-xs transition-colors ${
              onlyWithParams
                ? 'border-[#E21321]/70 bg-[#E21321]/5 text-[#E21321]'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <span
              className={`w-3 h-3 rounded-[4px] border flex items-center justify-center text-[9px] ${
                onlyWithParams
                  ? 'border-[#E21321] bg-[#E21321]'
                  : 'border-gray-300 bg-white'
              }`}
            >
              {onlyWithParams && <i className="fa-solid fa-check text-white" />}
            </span>
            Только с параметрами
          </button>
        </div>
      </div>

      {/* Фильтры по параметрам: Год, Регион, Рулевое, Кузов, КПП, Модель, Серия, Двигатель */}
      {mods.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-slate-50/60 px-4 py-3">
          <p className="text-[11px] text-gray-500 mb-2">Фильтр по параметрам</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {FILTER_SLOTS.map(({ key, label }) => {
              const options = filterOptionsByKey[key] ?? [];
              if (options.length === 0) return null;
              return (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-gray-600">
                    {label}:
                  </label>
                  <select
                    value={paramFilters[key] ?? ''}
                    onChange={(e) => setFilter(key, e.target.value)}
                    className="h-9 w-full rounded-xl border border-gray-200 bg-white px-2 text-[11px] text-gray-800 outline-none focus:border-[#E21321] focus:ring-1 focus:ring-[#E21321]/40 transition-colors"
                  >
                    <option value="">Все</option>
                    {options.map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mods.length === 0 ? (
        <p className="text-sm text-gray-500">
          Для этой модели пока нет доступных модификаций.
        </p>
      ) : filteredSortedMods.length === 0 ? (
        <p className="text-sm text-gray-500">
          По заданным критериям ничего не найдено. Попробуйте изменить запрос
          или фильтры.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredSortedMods.map((mod) => {
            const typeId = data.type?.id ?? type;
            const markId = data.mark?.id ?? mark;
            const modelIdVal = data.model?.id ?? modelId;
            const groupsUrl = `${ROUTES.BRAND_MODEL_GROUPS}?type=${encodeURIComponent(typeId)}&mark=${encodeURIComponent(markId)}&model=${encodeURIComponent(modelIdVal)}&modification=${encodeURIComponent(mod.id)}&name=${encodeURIComponent(mod.name ?? '')}`;
            const modelImgSrc = mod.modelImg?.startsWith('//')
              ? `https:${mod.modelImg}`
              : (mod.modelImg ?? null);
            const sortedParams =
              mod.parameters && mod.parameters.length > 0
                ? getSortedParams(mod.parameters)
                : [];

            return (
              <Link
                href={groupsUrl}
                key={mod.id}
                className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)] hover:-translate-y-0.5 transition-all duration-200 flex"
              >
                <span className="pointer-events-none absolute inset-px rounded-xl bg-linear-to-br from-white via-white to-slate-50 opacity-80 group-hover:opacity-100 transition-opacity duration-200" />

                {modelImgSrc && (
                  <div className="relative z-10 w-40 shrink-0 bg-slate-50 flex items-center justify-center p-1.5 border-r border-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={modelImgSrc}
                      alt=""
                      className="h-auto w-full object-contain rounded-xl"
                    />
                  </div>
                )}

                <div className="relative z-10 flex flex-col gap-1 flex-1 min-w-0 p-3">
                  <h3 className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">
                    {mod.name}
                  </h3>

                  {mod.description && (
                    <p className="text-[10px] text-gray-500 line-clamp-1">
                      {mod.description}
                    </p>
                  )}
                </div>

                <span className="pointer-events-none absolute inset-x-3 bottom-1.5 h-px rounded-full bg-linear-to-r from-[#E21321]/60 via-[#ff8a3d]/60 to-[#E21321]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
