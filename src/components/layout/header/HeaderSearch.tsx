'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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

  const [searchValue, setSearchValue] = useState('');
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] =
    useState<SearchResultPayload | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchValue.trim();
    if (!query) {
      setShowSearchDrop(false);
      setSearchResults(null);
      setSearchError(null);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      // Нормализуем строку для распознавания VIN / номера / названия
      const normalized = query.replace(/[\s-]/g, '').toUpperCase();
      const letters = normalized.match(/[A-Z]/g) || [];
      const digits = normalized.match(/[0-9]/g) || [];
      const isDigitsOnly = /^[0-9]+$/.test(normalized);

      // Простая эвристика VIN: длина 11–17, достаточно букв и цифр, без пробелов
      const looksLikeVin =
        normalized.length >= 11 &&
        normalized.length <= 17 &&
        letters.length >= 2 &&
        digits.length >= 5;

      if (looksLikeVin) {
        // VIN → ищем в ACAT (твоя внутренняя логика)
        const data = await searchCatalog(query);
        setSearchResults({
          ...data,
          query,
          kind: 'vin',
          autopiterParts: [],
        });
      } else {
        // Всё остальное (номер детали ИЛИ название) → Autopiter
        const autopiter = await searchAutopiterByNumber(query);
        const kind: 'oem' | 'name' = isDigitsOnly ? 'oem' : 'name';

        setSearchResults({
          query,
          kind,
          parts: [],
          cars: [],
          autopiterParts: autopiter,
        });
      }

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

  return (
    <div className={styles.formWrap} ref={formRef}>
      {isSearchFocused && (
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
        />
        <button type="submit" className={styles.searchBtn}>
          <i className="fa-solid fa-magnifying-glass text-[18px]" aria-hidden />
        </button>
      </form>

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
            <div className={styles.infoLine}>
              <span className="text-xs text-gray-500">Идёт поиск...</span>
            </div>
          )}

          {searchError && !searchLoading && (
            <div className={styles.infoLine}>
              <span className="text-xs text-red-500">{searchError}</span>
            </div>
          )}

          {!searchLoading && !searchError && searchResults && (
            <>
              {/* VIN: показываем авто — клик ведёт на схему/группы деталей */}
              {searchResults.kind === 'vin' && (
                <div className="max-h-56 overflow-y-auto pr-1">
                  {searchResults.cars.map((car) => {
                    const region = car.parameters?.find(
                      (p) => p.key === 'sales_region'
                    )?.value;
                    const canGoToGroups =
                      car.typeId &&
                      car.markId &&
                      car.modelId &&
                      car.modificationId;
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
                    return (
                      <div
                        className={styles.infoLine}
                        key={car.id}
                        role={groupsUrl ? 'button' : undefined}
                        onClick={() => {
                          if (groupsUrl) {
                            setShowSearchDrop(false);
                            router.push(groupsUrl);
                          }
                        }}
                        style={
                          groupsUrl
                            ? {
                                cursor: 'pointer',
                              }
                            : undefined
                        }
                      >
                        <b>
                          {car.brand ? `${car.brand} ${car.model}` : car.model}
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

              {/* Детали: по номеру/названию (внутренняя БД) */}
              {searchResults.kind !== 'vin' &&
                searchResults.parts.slice(0, 5).map((part) => (
                  <div className={styles.infoLine} key={part.id}>
                    <i
                      className="fa-solid fa-hashtag text-[14px]"
                      aria-hidden
                    />
                    <b>{part.number}</b>
                    <span>{part.brand ?? part.name}</span>
                  </div>
                ))}

              {/* Партнёрский сервис (Autopiter) по номеру детали */}
              {searchResults.autopiterParts &&
                searchResults.autopiterParts.length > 0 && (
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
                  </>
                )}

              {((searchResults.kind === 'vin' &&
                searchResults.cars.length === 0) ||
                (searchResults.kind !== 'vin' &&
                  searchResults.parts.length === 0)) &&
                (!searchResults.autopiterParts ||
                  searchResults.autopiterParts.length === 0) && (
                  <div className={styles.infoLine}>
                    <span className="text-xs text-gray-500">
                      Ничего не найдено по запросу «{searchResults.query}».
                    </span>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
