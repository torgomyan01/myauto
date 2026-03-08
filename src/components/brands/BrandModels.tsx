'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { getAcatModels } from '@/app/actions/acat';

interface BrandModelsProps {
  mark: string;
  markName?: string | null;
}

interface AcatModel {
  id: string;
  name: string;
  relevance?: string | null;
  years?: string | null;
  modification?: string | null;
  image?: string | null;
  archival?: boolean;
  hasModifications?: boolean;
}

interface AcatModelsResponse {
  type: {
    id: string;
    name: string;
  };
  mark: {
    id: string;
    name: string;
    image?: string;
    archival: boolean;
    engine: boolean;
    vin: boolean;
    searchParts: boolean;
    hasModifications: boolean;
  };
  models: AcatModel[];
}

async function getBrandModels(mark: string): Promise<AcatModelsResponse> {
  return getAcatModels({ mark }) as Promise<AcatModelsResponse>;
}

export default function BrandModels({ mark, markName }: BrandModelsProps) {
  const enabled = Boolean(mark);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['brand-models', mark],
    queryFn: () => getBrandModels(mark),
    enabled,
  });

  if (!mark) {
    return (
      <div className="mt-6 text-sm text-red-500">
        Не заданы параметры марки. Попробуйте перейти на страницу из списка
        брендов.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-6 text-sm text-gray-500">Загружаем модели марки…</div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mt-6 text-sm text-red-500">
        Не удалось загрузить модели. Попробуйте позже.
      </div>
    );
  }

  const models = data.models ?? [];
  const titleMarkName = markName ?? data.mark?.name ?? mark;
  const typeId = data.type?.id ?? '';

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          {data.mark?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.mark.image}
              alt={titleMarkName}
              className="h-10 w-10 rounded-full bg-white border border-gray-200 object-contain p-1"
            />
          )}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
              Модели {titleMarkName}
            </h2>
            {data.type && (
              <p className="mt-0.5 text-xs md:text-sm text-gray-500">
                Тип: {data.type?.name ?? data.type?.id}
              </p>
            )}
          </div>
        </div>
      </div>

      {models.length === 0 ? (
        <p className="text-sm text-gray-500">
          Для этой марки пока нет доступных моделей.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {models.map((model) => {
            const typeVal = typeId || data.type?.id;
            const markVal = data.mark?.id ?? mark;
            const hasMods = model.hasModifications !== false;
            const modelUrl = hasMods
              ? `${ROUTES.BRAND_MODEL_MODS}?type=${encodeURIComponent(typeVal)}&mark=${encodeURIComponent(markVal)}&model=${encodeURIComponent(model.id)}&name=${encodeURIComponent(model.name ?? '')}`
              : `${ROUTES.BRAND_MODEL_GROUPS}?type=${encodeURIComponent(typeVal)}&mark=${encodeURIComponent(markVal)}&model=${encodeURIComponent(model.id)}&modification=null&name=${encodeURIComponent(model.name ?? '')}`;

            return (
              <Link
                href={modelUrl}
                key={model.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] hover:shadow-[0_18px_40px_rgba(15,23,42,0.18)] hover:-translate-y-1.5 transition-all duration-200 cursor-pointer"
              >
                {/* gradient ring */}
                <span className="pointer-events-none absolute inset-px rounded-2xl bg-linear-to-br from-white via-white to-slate-50 opacity-80 group-hover:opacity-100 transition-opacity duration-200" />

                <div className="relative z-10 flex items-start gap-3">
                  {model.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <div className="shrink-0">
                      <img
                        src={model.image}
                        alt={model.name}
                        className="h-16 w-24 md:h-20 md:w-28 rounded-xl bg-gray-50 object-contain p-2 border border-gray-100 group-hover:scale-105 group-hover:-rotate-1 transition-transform duration-200"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {model.name}
                      </h3>
                      {model.hasModifications && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-[10px] font-medium text-emerald-600 px-2 py-[2px]">
                          <span className="w-1 h-1 rounded-full bg-emerald-500" />
                          модификации
                        </span>
                      )}
                      {model.archival && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-[10px] font-medium text-gray-500 px-2 py-[2px]">
                          архив
                        </span>
                      )}
                    </div>
                    {model.years && (
                      <p className="text-[11px] text-gray-500">
                        Годы выпуска:{' '}
                        <span className="font-medium text-gray-700">
                          {model.years}
                        </span>
                      </p>
                    )}
                    {/* Блок информации о модификациях */}
                    {(model.hasModifications || model.modification) && (
                      <div className="mt-1.5 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5">
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">
                          Модификации
                        </p>
                        {model.hasModifications && !model.modification && (
                          <p className="text-[11px] text-slate-600">
                            У модели есть модификации — выбор при переходе
                          </p>
                        )}
                        {model.modification && (
                          <p className="text-[11px] text-slate-700 line-clamp-2">
                            {model.modification}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* bottom accent bar */}
                <span className="pointer-events-none absolute inset-x-4 bottom-2 h-[2px] rounded-full bg-linear-to-r from-[#E21321]/70 via-[#ff8a3d]/70 to-[#E21321]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
