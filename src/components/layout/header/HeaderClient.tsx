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
import { NotificationsDropdown } from './NotificationsDropdown';
import { HeaderSearch } from './HeaderSearch';
import { searchCatalog } from '@/app/actions/search';
import { searchAutopiterByNumber } from '@/lib/autopiter';

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
  autopiterParts?: {
    ArticleId: number;
    CatalogName: string;
    Name: string;
    Number: string | number;
    SalesRating: number;
  }[];
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
  const [mobileAddOpen, setMobileAddOpen] = useState(false);
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
      // Определяем тип запроса:
      // - только цифры или очень мало букв (<=1) → номер детали (OEM/артикул)
      // - есть хотя бы 2 буквы → VIN / текстовый поиск
      const letters = query.match(/[A-Za-z]/g) || [];
      const isDigitsOnly = /^[0-9]+$/.test(query);
      const isPartNumber = isDigitsOnly || letters.length <= 1;

      if (isPartNumber) {
        // Поиск по номеру детали через партнёрский сервис (Autopiter)
        const autopiter = await searchAutopiterByNumber(query);
        setSearchResults({
          query,
          kind: 'oem',
          parts: [],
          cars: [],
          autopiterParts: autopiter,
        });
      } else {
        // VIN / обычный поиск через нашу внутреннюю логику
        const data = await searchCatalog(query);
        setSearchResults({
          ...data,
          autopiterParts: [],
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
    <header className={styles.header}>
      <div className="wrapper relative z-50">
        <div className={styles.headerInfo}>
          <Link href={ROUTES.HOME} className={styles.logo}>
            <Image src="/img/logo.svg" alt="MyAuto" width={160} height={40} />
          </Link>

          <HeaderSearch />

          {session ? (
            <>
              <div
                className={`${styles.iconsWrap} max-[1024px]:hidden`}
                ref={iconsWrapRef}
              >
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
                <NotificationsDropdown
                  isOpen={openDropdown === 'notifications'}
                  onToggle={() => toggleDropdown('notifications')}
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
                    <span className="flex items-center gap-1">
                      <i
                        className="fa-regular fa-plus text-[20px] max-[1024px]:text-base"
                        aria-hidden
                      />
                    </span>
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

              {/* Mobile bottom navigation */}
              <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-2 py-1.5 shadow-[0_-8px_30px_rgba(15,23,42,0.16)] backdrop-blur-md md:hidden">
                <div className="mx-auto flex max-w-4xl items-center justify-between text-[11px] font-medium text-zinc-600">
                  <Link
                    href={ROUTES.CART}
                    className="flex flex-1 flex-col items-center gap-0.5 px-1"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
                      <i
                        className="fa-regular fa-cart-shopping text-[15px]"
                        aria-hidden
                      />
                    </span>
                    <span className="text-[10px]">Корзина</span>
                  </Link>

                  <Link
                    href={ROUTES.GARAGE}
                    className="flex flex-1 flex-col items-center gap-0.5 px-1"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
                      <i
                        className="fa-regular fa-car text-[15px]"
                        aria-hidden
                      />
                    </span>
                    <span className="text-[10px]">Гараж</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setMobileAddOpen(true)}
                    className="flex flex-1 flex-col items-center gap-0.5 px-1"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E21321] text-white shadow-[0_8px_20px_rgba(226,19,33,0.55)]">
                      <i
                        className="fa-regular fa-plus text-[15px]"
                        aria-hidden
                      />
                    </span>
                    <span className="text-[10px] text-zinc-700">Добавить</span>
                  </button>

                  <Link
                    href={ROUTES.NOTIFICATIONS}
                    className="flex flex-1 flex-col items-center gap-0.5 px-1"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
                      <i
                        className="fa-regular fa-bell text-[15px]"
                        aria-hidden
                      />
                    </span>
                    <span className="text-[10px]">Уведомления</span>
                  </Link>

                  <Link
                    href={ROUTES.PROFILE}
                    className="flex flex-1 flex-col items-center gap-0.5 px-1"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
                      <i
                        className="fa-regular fa-user text-[15px]"
                        aria-hidden
                      />
                    </span>
                    <span className="text-[10px]">Профиль</span>
                  </Link>
                </div>
              </div>

              {/* Mobile "add" selector modal */}
              {mobileAddOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
                  <div
                    className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
                    onClick={() => setMobileAddOpen(false)}
                    aria-hidden
                  />
                  <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white px-4 pb-6 pt-4 shadow-[0_-18px_60px_rgba(15,23,42,0.35)]">
                    <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200" />
                    <h2 className="mb-1 text-center text-sm font-semibold text-zinc-900">
                      Что вы хотите добавить?
                    </h2>
                    <p className="mb-4 text-center text-[11px] text-zinc-500">
                      Выберите тип объявления. Вы всегда сможете добавить больше
                      позже.
                    </p>
                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setMobileAddOpen(false);
                          router.push(ROUTES.ADD_CAR);
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-left text-[13px] text-zinc-800 transition-colors hover:border-[#E21321]/60 hover:bg-zinc-50/80"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                          <i className="fa-solid fa-car text-sm" aria-hidden />
                        </span>
                        <div className="flex flex-1 flex-col">
                          <span className="font-medium">
                            Добавить объявление
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            Продажа автомобиля целиком
                          </span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileAddOpen(false);
                          router.push(ROUTES.ADD_PART);
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3.5 py-2.5 text-left text-[13px] text-zinc-800 transition-colors hover:border-[#E21321]/60 hover:bg-zinc-50"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                          <i
                            className="fa-sharp fa-regular fa-gear text-sm"
                            aria-hidden
                          />
                        </span>
                        <div className="flex flex-1 flex-col">
                          <span className="font-medium">Добавить запчасть</span>
                          <span className="text-[11px] text-zinc-500">
                            Отдельные детали и комплектующие
                          </span>
                        </div>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobileAddOpen(false)}
                      className="mt-3 w-full rounded-2xl border border-zinc-200 py-2 text-center text-[12px] font-medium text-zinc-600 hover:bg-zinc-50"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
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
