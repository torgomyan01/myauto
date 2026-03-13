'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import styles from './Header.module.scss';
import { ROUTES } from '@/constants/routes';
import { searchCatalog } from '@/app/actions/search';
import { searchAutopiterByNumber } from '@/lib/autopiter';

interface SearchPartResult {
  id: string;
  number: string;
  name: string;
  brand?: string;
}

interface VinParameter {
  key: string;
  name: string;
  value: string;
}

interface SearchCarResult {
  id: string;
  vin?: string;
  brand?: string;
  model: string;
  years?: string;
  typeId?: string;
  markId?: string;
  modelId?: string;
  modificationId?: string;
  modificationName?: string;
  parameters?: VinParameter[];
}

interface SearchResultPayload {
  query: string;
  kind: 'vin' | 'oem' | 'name';
  parts: SearchPartResult[];
  cars: SearchCarResult[];
  autopiterParts?: {
    ArticleId: number;
    CatalogName: string;
    Name: string;
    Number: string | number;
    SalesRating: number;
  }[];
}

export function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();

  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const [searchValue, setSearchValue] = useState(query);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] =
    useState<SearchResultPayload | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const isSearchPage = pathname === ROUTES.SEARCH;

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setShowSearchDrop(false);
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const runSearch = async (query: string) => {
    if (!query.trim()) {
      setShowSearchDrop(false);
      setSearchResults(null);
      setSearchError(null);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      // Нормализуем строку для подписи режима поиска
      const normalized = query.replace(/[\s-]/g, '').toUpperCase();
      const letters = normalized.match(/[A-Z]/g) || [];
      const digits = normalized.match(/[0-9]/g) || [];
      const isDigitsOnly = /^[0-9]+$/.test(normalized);
      const looksLikeVin =
        normalized.length >= 11 &&
        normalized.length <= 17 &&
        letters.length >= 2 &&
        digits.length >= 5;
      const kind: 'vin' | 'oem' | 'name' = looksLikeVin
        ? 'vin'
        : isDigitsOnly
          ? 'oem'
          : 'name';

      // Всегда ищем в двух сервисах параллельно
      const [acatRes, autopiterRes] = await Promise.allSettled([
        searchCatalog(query),
        searchAutopiterByNumber(query),
      ]);

      const acat =
        acatRes.status === 'fulfilled'
          ? acatRes.value
          : { query, kind, parts: [], cars: [] };
      const autopiter =
        autopiterRes.status === 'fulfilled' ? autopiterRes.value : [];

      if (acatRes.status === 'rejected') {
        console.error('ACAT search error', acatRes.reason);
      }
      if (autopiterRes.status === 'rejected') {
        console.error('Autopiter search error', autopiterRes.reason);
      }

      setSearchResults({
        query,
        kind: acat.kind ?? kind,
        parts: Array.isArray(acat.parts) ? acat.parts : [],
        cars: Array.isArray(acat.cars) ? acat.cars : [],
        autopiterParts: Array.isArray(autopiter) ? autopiter : [],
      });

      setShowSearchDrop(true);
    } catch (error) {
      console.error('Search API error', error);
      setSearchError('Не удалось выполнить поиск. Попробуйте позже.');
      setSearchResults(null);
      setShowSearchDrop(false);
    } finally {
      setSearchLoading(false);
    }
  };

  // Поиск при нажатии Enter (переход на страницу /search)
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchValue.trim();
    if (!query) {
      setShowSearchDrop(false);
      setSearchResults(null);
      setSearchError(null);
      return;
    }

    // Перейти на страницу расширенного поиска
    router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(query)}`);
    setShowSearchDrop(false);
  };

  // Авто‑поиск по мере ввода (debounce)
  useEffect(() => {
    if (isSearchPage) {
      setShowSearchDrop(false);
      return;
    }

    const q = searchValue.trim();

    if (!q) {
      setShowSearchDrop(false);
      setSearchResults(null);
      setSearchError(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void runSearch(q);
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, isSearchPage]);

  return (
    <div className={styles.formWrap} ref={formRef}>
      {isSearchFocused && !isSearchPage && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
          onClick={() => setIsSearchFocused(false)}
        />
      )}
      <form onSubmit={handleSearch} className="relative z-100">
        <input
          type="text"
          placeholder="Введите VIN, номер или название детали"
          value={searchValue}
          onFocus={() => setIsSearchFocused(true)}
          onChange={(e) => {
            setSearchValue(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleSearch();
            }
          }}
        />
        <button type="submit" className={styles.searchBtn}>
          <i className="fa-solid fa-magnifying-glass text-[18px]" aria-hidden />
        </button>
      </form>

      {!isSearchPage && (
        <div
          className={`${styles.formHideContent} ${
            showSearchDrop ? styles.show : ''
          }`}
        >
          <div className={styles.topLine}>
            <div className="checkbox-wrap">
              <label>
                <input type="checkbox" />
                <span></span>
                Искать детали для авто из гаража
              </label>
            </div>
            <span className={styles.marka}>
              {searchResults?.kind === 'vin'
                ? 'Поиск по VIN'
                : searchResults?.kind === 'oem'
                  ? 'Поиск по номеру детали'
                  : 'Поиск по названию'}
            </span>
          </div>

          <div className={styles.info}>
            {searchLoading && (
              <div className="space-y-2 py-1">
                {/* shimmer line */}
                <div className="h-3 w-24 animate-pulse rounded-full bg-zinc-200/80" />

                {/* skeleton rows */}
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white/60 px-3 py-2 shadow-[0_1px_4px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100">
                      <div className="h-3 w-3 animate-ping rounded-full bg-zinc-400/70" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-32 animate-pulse rounded-full bg-zinc-200" />
                      <div className="flex gap-2">
                        <div className="h-2.5 w-16 animate-pulse rounded-full bg-zinc-200/80" />
                        <div className="h-2.5 w-10 animate-pulse rounded-full bg-zinc-100" />
                      </div>
                    </div>
                    <div className="hidden h-5 w-10 animate-pulse rounded-full bg-emerald-100/80 text-[10px] font-medium text-emerald-700 sm:block" />
                  </div>
                ))}
              </div>
            )}

            {searchError && !searchLoading && (
              <div className={styles.infoLine}>
                <span className="text-xs text-red-500">{searchError}</span>
              </div>
            )}

            {!searchLoading && !searchError && searchResults && (
              <>
                <div className="pb-1 pl-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    Каталог
                  </span>
                </div>

                {/* ACAT: VIN автомобили */}
                {searchResults.cars.length > 0 && (
                  <div className="max-h-56 overflow-y-auto pr-1">
                    {searchResults.cars.slice(0, 5).map((car) => {
                      const region = car.parameters?.find(
                        (p) => p.key === 'sales_region'
                      )?.value;
                      const canGoToGroups =
                        car.typeId &&
                        car.markId &&
                        car.modelId &&
                        car.modificationId;
                      const canGoToModel =
                        car.typeId && car.markId && car.modelId;
                      const canGoToBrand = car.markId;

                      const groupsUrl = canGoToGroups
                        ? `${ROUTES.BRAND_MODEL_GROUPS}?type=${encodeURIComponent(
                            car.typeId!
                          )}&mark=${encodeURIComponent(
                            car.markId!
                          )}&model=${encodeURIComponent(
                            car.modelId!
                          )}&modification=${encodeURIComponent(
                            car.modificationId!
                          )}&name=${encodeURIComponent(
                            car.modificationName ?? car.model ?? ''
                          )}`
                        : null;
                      const modelUrl =
                        !groupsUrl && canGoToModel
                          ? `${ROUTES.BRAND_MODEL_MODS}?type=${encodeURIComponent(
                              car.typeId!
                            )}&mark=${encodeURIComponent(
                              car.markId!
                            )}&model=${encodeURIComponent(
                              car.modelId!
                            )}&name=${encodeURIComponent(car.model ?? '')}`
                          : null;
                      const brandUrl =
                        !groupsUrl && !modelUrl && canGoToBrand
                          ? `${ROUTES.BRANDS_MODELS}?mark=${encodeURIComponent(
                              car.markId!
                            )}&name=${encodeURIComponent(car.brand ?? '')}`
                          : null;
                      const targetUrl = groupsUrl ?? modelUrl ?? brandUrl;
                      return (
                        <div
                          className={styles.infoLine}
                          key={car.id}
                          role={targetUrl ? 'button' : undefined}
                          onClick={() => {
                            if (targetUrl) {
                              setShowSearchDrop(false);
                              router.push(targetUrl);
                            }
                          }}
                          style={
                            targetUrl
                              ? {
                                  cursor: 'pointer',
                                }
                              : undefined
                          }
                        >
                          <b>
                            {car.brand
                              ? `${car.brand} ${car.model}`
                              : car.model}
                          </b>
                          <span>
                            {car.years ? ` · ${car.years}` : ''}
                            {region ? ` · ${region}` : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ACAT: детали */}
                {searchResults.parts.slice(0, 5).map((part) => (
                  <div className={styles.infoLine} key={part.id}>
                    <i
                      className="fa-solid fa-hashtag text-[14px]"
                      aria-hidden
                    />
                    <b>{part.number}</b>
                    <span>{part.brand ?? part.name}</span>
                  </div>
                ))}

                {searchResults.cars.length === 0 &&
                  searchResults.parts.length === 0 && (
                    <div className={styles.infoLine}>
                      <span className="text-xs text-gray-500">
                        В каталоге ничего не найдено.
                      </span>
                    </div>
                  )}

                {(searchResults.cars.length > 0 ||
                  searchResults.parts.length > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSearchDrop(false);
                      router.push(
                        `${ROUTES.SEARCH}?q=${encodeURIComponent(
                          searchResults.query
                        )}`
                      );
                    }}
                    className="mt-1 block mx-auto rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    Показать все
                  </button>
                )}

                <div className="pt-2 pb-1 pl-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    Запчасти
                  </span>
                </div>

                {searchResults.autopiterParts &&
                searchResults.autopiterParts.length > 0 ? (
                  <>
                    {searchResults.autopiterParts.slice(0, 5).map((p) => (
                      <div
                        key={`${p.ArticleId}-${p.CatalogName}-${p.Number}`}
                        className={styles.infoLine}
                      >
                        <i
                          className="fa-solid fa-hashtag text-[14px]"
                          aria-hidden
                        />
                        <b>{p.Number}</b>
                        <span className="truncate">
                          {p.Name}{' '}
                          <span className="text-[11px] text-zinc-400">
                            · {p.CatalogName}
                          </span>
                        </span>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setShowSearchDrop(false);
                        router.push(
                          `${ROUTES.SEARCH}?q=${encodeURIComponent(
                            searchResults.query
                          )}`
                        );
                      }}
                      className="mt-1 block mx-auto rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      Показать все
                    </button>
                  </>
                ) : (
                  <div className={styles.infoLine}>
                    <span className="text-xs text-gray-500">
                      В запчастях ничего не найдено.
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
