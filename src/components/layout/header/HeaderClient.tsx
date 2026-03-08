'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Session } from 'next-auth';
import styles from './Header.module.scss';
import { ROUTES } from '@/constants/routes';
import LanguageSelect from './LanguageSelect';
import GarageDropdown from './GarageDropdown';
import UserDropdown from './UserDropdown';
import { searchCatalog } from '@/app/actions/search';

interface HeaderClientProps {
  session: Session | null;
}

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
}

export default function HeaderClient({ session }: HeaderClientProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] =
    useState<SearchResultPayload | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const iconsWrapRef = useRef<HTMLDivElement>(null);

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

  const toggleDropdown = (name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

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
      const data = await searchCatalog(query);

      setSearchResults(data);
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
    <header className={styles.header}>
      <div className="wrapper relative z-50">
        <div className={styles.headerInfo}>
          <Link href={ROUTES.HOME} className={styles.logo}>
            <Image src="/img/logo.svg" alt="MyAuto" width={160} height={40} />
          </Link>

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
                <i
                  className="fa-solid fa-magnifying-glass text-[18px]"
                  aria-hidden
                />
              </button>
            </form>

            <div
              className={`${styles.formHideContent} ${showSearchDrop ? styles.show : ''}`}
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
                            ? `${ROUTES.BRAND_MODEL_GROUPS}?type=${encodeURIComponent(car.typeId!)}&mark=${encodeURIComponent(car.markId!)}&model=${encodeURIComponent(car.modelId!)}&modification=${encodeURIComponent(car.modificationId!)}&name=${encodeURIComponent(car.modificationName ?? car.model ?? '')}`
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

                    {/* Детали: по номеру/названию */}
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

                    {((searchResults.kind === 'vin' &&
                      searchResults.cars.length === 0) ||
                      (searchResults.kind !== 'vin' &&
                        searchResults.parts.length === 0)) && (
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

          {session ? (
            <>
              <div className={styles.iconsWrap} ref={iconsWrapRef}>
                <div className={styles.basket}>
                  <Link href={ROUTES.CART} className={styles.icon}>
                    <i
                      className="fa-regular fa-cart-shopping text-[20px]"
                      aria-hidden
                    />
                    <span className={styles.count}>3</span>
                  </Link>
                </div>
                <UserDropdown
                  isOpen={openDropdown === 'user'}
                  onToggle={() => toggleDropdown('user')}
                  session={session}
                />
                <div className={styles.cars}>
                  <div
                    className={styles.icon}
                    onClick={() => toggleDropdown('cars')}
                  >
                    <i className="fa-regular fa-car text-[20px]" aria-hidden />
                  </div>
                  {openDropdown === 'cars' && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => toggleDropdown('cars')}
                    />
                  )}
                  <div
                    className={`${styles.carsInfoHide} ${openDropdown === 'cars' ? styles.show : ''} z-50`}
                  >
                    <GarageDropdown />
                  </div>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown('add')}
                    className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[10px] bg-[#f9f9f9] transition-colors hover:bg-[#ececec] max-[1024px]:h-8 max-[1024px]:w-8"
                    aria-expanded={openDropdown === 'add'}
                    aria-haspopup="true"
                  >
                    <i
                      className="fa-regular fa-plus text-[20px] max-[1024px]:text-base"
                      aria-hidden
                    />
                  </button>
                  {openDropdown === 'add' && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => toggleDropdown('add')}
                      aria-hidden
                    />
                  )}
                  <div
                    className={`absolute left-1/2 top-[calc(100%+8px)] z-50 min-w-[250px] -translate-x-1/2 rounded-xl border border-zinc-200/80 bg-white py-2 shadow-lg transition-all duration-200 ${
                      openDropdown === 'add'
                        ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                        : 'pointer-events-none scale-95 opacity-0'
                    }`}
                  >
                    <Link
                      href={ROUTES.ADD_CAR}
                      onClick={() => toggleDropdown('add')}
                      className="flex items-center gap-3 px-4 py-2.5 text-left text-[15px] text-zinc-800 transition-colors hover:bg-zinc-100"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                        <i className="fa-solid fa-car text-sm" aria-hidden />
                      </span>
                      Добавить объявление
                    </Link>
                    <Link
                      href={ROUTES.ADD_PART}
                      onClick={() => toggleDropdown('add')}
                      className="flex items-center gap-3 px-4 py-2.5 text-left text-[15px] text-zinc-800 transition-colors hover:bg-zinc-100"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                        <i className="fa-sharp fa-regular fa-gear"></i>
                      </span>
                      Добавить запчасть
                    </Link>
                  </div>
                </div>
              </div>
              <LanguageSelect />
            </>
          ) : (
            <div className="flex items-center gap-6">
              <LanguageSelect />
              <div className="flex items-center gap-3 text-sm">
                <Link
                  href={ROUTES.LOGIN}
                  className="text-gray-800 hover:text-[#E21321] transition-colors"
                >
                  Вход
                </Link>
                <span className="text-gray-300">/</span>
                <Link
                  href={ROUTES.REGISTER}
                  className="text-[#E21321] font-semibold hover:underline"
                >
                  Регистрация
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
