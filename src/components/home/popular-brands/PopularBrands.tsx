/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ROUTES } from '@/constants/routes';
import { getAcatCatalog } from '@/app/actions/acat';

interface Brand {
  id: string;
  name: string;
  image: string;
}

interface PopularBrandsProps {
  mode?: 'popular' | 'all';
  hideTitle?: boolean;
  searchQuery?: string;
  /** Фильтр по сегменту каталога: light (легковые+мото), heavy (грузовые+автобусы+спецтехника+двигатели), moto (только мото) */
  segment?: string;
}

// Список самых популярных брендов, которые хотим показывать на главной
const POPULAR_BRAND_NAMES = [
  'Audi',
  'BMW',
  'Mercedes',
  'Cadillac',
  'Chevrolet',
  'Opel',
  'Mitsubishi',
  'Nissan',
  'Lexus',
  'Mazda',
  'Infiniti',
  'Kia',
  'Toyota',
  'Volkswagen',
  'Jeep',
  'Fiat',
  'Ford',
  'Ford usa',
  'Honda',
  'Hyundai',
  'Land rover',
  'Peugeot',
  'Renault',
  'Skoda',
  'SsangYong',
  'Subaru',
  'Suzuki',
  'Volvo',
  'ЗАЗ',
  'ВАЗ',
].map((name) => name.toLowerCase());

async function getBrands(segment?: string): Promise<Brand[]> {
  const data = await getAcatCatalog(segment);

  if (!Array.isArray(data)) {
    return [];
  }

  // data = [{ name, image, marks: [...] }, ...]
  // Собираем марки и убираем дубликаты по имени
  const byName = new Map<string, Brand>();

  data.forEach((category: any) => {
    if (Array.isArray(category.marks)) {
      category.marks.forEach((mark: any) => {
        if (mark && mark.id && mark.name && mark.image) {
          const key = String(mark.name).toLowerCase();
          if (!byName.has(key)) {
            byName.set(key, {
              id: String(mark.id),
              name: String(mark.name),
              image: String(mark.image),
            });
          }
        }
      });
    }
  });

  // Возвращаем уникальный по имени список
  return Array.from(byName.values());
}

export default function PopularBrands({
  mode = 'popular',
  hideTitle = false,
  searchQuery,
  segment,
}: PopularBrandsProps) {
  const { data, isLoading, isError } = useQuery<Brand[]>({
    queryKey: ['brands', segment],
    queryFn: () => getBrands(segment),
  });

  const hasApiBrands = Array.isArray(data) && data.length > 0;
  const allBrands = hasApiBrands ? data! : [];
  const normalizedQuery =
    typeof searchQuery === 'string' && searchQuery.trim().length > 0
      ? searchQuery.trim().toLowerCase()
      : '';

  // В популярном режиме фильтруем по списку, в режиме all — показываем все бренды
  const baseList =
    mode === 'popular'
      ? allBrands
          .filter((brand) =>
            POPULAR_BRAND_NAMES.includes(brand.name.toLowerCase())
          )
          .sort(
            (a, b) =>
              POPULAR_BRAND_NAMES.indexOf(a.name.toLowerCase()) -
              POPULAR_BRAND_NAMES.indexOf(b.name.toLowerCase())
          )
      : [...allBrands].sort((a, b) =>
          a.name.localeCompare(b.name, 'ru-RU', { sensitivity: 'base' })
        );

  const brandsToShow =
    normalizedQuery && baseList.length
      ? baseList.filter((brand) =>
          brand.name.toLowerCase().includes(normalizedQuery)
        )
      : baseList;

  return (
    <section>
      <div className="rounded-3xl bg-white py-6 md:px-6 md:py-7">
        {!hideTitle && (
          <>
            <div className="flex items-center justify-between gap-4 mb-4 md:mb-6">
              <div>
                <h2 className="text-[20px] md:text-[24px] font-semibold text-gray-900">
                  {mode === 'popular' ? 'Популярные марки' : 'Все марки'}
                </h2>
                <p className="mt-1 text-xs md:text-sm text-gray-500">
                  Выберите производителя, чтобы быстрее найти подходящие
                  запчасти.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 mb-5 md:mb-6">
              <div className="h-[3px] w-20 rounded-full bg-linear-to-r from-[#E21321] to-[#ff8a3d]" />
              {mode === 'popular' && hasApiBrands && (
                <Link
                  href={ROUTES.BRANDS}
                  className="ml-auto inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-[11px] md:text-xs font-medium text-gray-700 hover:border-[#E21321]/60 hover:text-[#E21321] hover:shadow-sm transition-colors"
                >
                  <span className="hidden sm:inline">
                    Все бренды ({allBrands.length})
                  </span>
                  <span className="sm:hidden">Все бренды</span>
                </Link>
              )}
            </div>
          </>
        )}

        {isError && (
          <p className="text-xs md:text-sm text-red-500 mb-3">
            Не удалось загрузить бренды, показываем стандартные.
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 md:grid-cols-6 md:gap-4">
          {hasApiBrands &&
            brandsToShow.map((brand) => {
              const isHighlighted =
                mode === 'popular' &&
                POPULAR_BRAND_NAMES.includes(brand.name.toLowerCase());

              return (
                <Link
                  href={`${ROUTES.BRANDS_MODELS}?mark=${encodeURIComponent(brand.id)}&name=${encodeURIComponent(brand.name)}`}
                  key={`${brand.id}-${brand.name}`}
                  className="group relative flex items-center gap-2 rounded-2xl border border-slate-100 bg-white/95 px-3 py-2 text-left shadow-[0_6px_18px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-1.5 hover:border-[#E21321]/50 hover:shadow-[0_16px_36px_rgba(15,23,42,0.16)]"
                >
                  {/* left colored strip */}
                  <span className="pointer-events-none absolute inset-y-1 h-[70%] left-2 top-[15%] w-1 rounded-full bg-linear-to-b from-[#E21321] via-[#ff8a3d] to-amber-300 opacity-70 group-hover:opacity-100" />

                  {/* logo bubble */}
                  <div className="relative ml-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-[0_8px_22px_rgba(15,23,42,0.16)] ring-1 ring-slate-100/80 transition-all duration-200 md:h-12 md:w-12 group-hover:scale-105 group-hover:shadow-[0_14px_30px_rgba(15,23,42,0.22)]">
                    <img
                      src={brand.image}
                      alt={brand.name}
                      className="max-h-[70%] max-w-[70%] object-contain"
                    />
                  </div>

                  {/* brand text + pill */}
                  <div className="relative flex min-w-0 flex-1 flex-col justify-center pl-1 pr-4">
                    <span className="truncate text-[11px] font-semibold text-slate-900 md:text-xs group-hover:text-[#E21321]">
                      {brand.name}
                    </span>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {isHighlighted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#E21321]/6 px-2 py-[2px] text-[9px] font-semibold uppercase tracking-[0.12em] text-[#E21321]">
                          <span className="h-1 w-1 rounded-full bg-[#E21321]" />
                          хит
                        </span>
                      )}
                    </div>
                  </div>

                  {/* arrow hint */}
                  <div className="mr-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 text-[10px] text-slate-400 transition-colors duration-200 group-hover:bg-[#E21321]/10 group-hover:text-[#E21321]">
                    <span className="translate-x-[1px]">›</span>
                  </div>
                </Link>
              );
            })}

          {isLoading &&
            !hasApiBrands &&
            Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center gap-1 rounded-full animate-pulse"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-100" />
                <div className="w-10 h-2 rounded-full bg-gray-100" />
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
