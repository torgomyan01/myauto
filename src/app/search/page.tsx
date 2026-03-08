'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import MainTemplate from '@/components/layout/main-template/MainTemplate';
import AddToCartModal, {
  type CartProduct,
} from '@/components/home/add-to-cart-modal/AddToCartModal';
import { ROUTES } from '@/constants/routes';
import { searchCatalog, type SearchPartResult } from '@/app/actions/search';

const allProducts: CartProduct[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: 'Teboil Gold L 5W-30, 4л.',
  description: 'Teboil Gold 5W-30 4 л. Масло моторное',
  price: 6500,
  img: 'product-img.png',
}));

const BRANDS = ['Ravenol', 'Mobil', 'Toyota', 'Shell', 'Honda', 'Comma'];
const VISCOSITIES = ['0W-20', '0W-40', '5W-30', '10W-30', '15W-40', '0W-30'];

export default function SearchPage() {
  const [selectedBrands, setSelectedBrands] = useState<string[]>(['Mobil']);
  const [selectedViscosities, setSelectedViscosities] = useState<string[]>([
    '5W-30',
  ]);
  const [openSections, setOpenSections] = useState<string[]>([
    'brands',
    'viscosity',
  ]);
  const [modalProduct, setModalProduct] = useState<CartProduct | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchParts, setSearchParts] = useState<SearchPartResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const toggleSection = (key: string) => {
    setOpenSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleFromList = (
    value: string,
    list: string[],
    setList: (val: string[]) => void
  ) => {
    setList(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value]
    );
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const openModal = (product: CartProduct) => setModalProduct(product);
  const closeModal = () => setModalProduct(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const body = document.body;
    const previous = body.style.overflow;

    if (mobileFiltersOpen) {
      body.style.overflow = 'hidden';
    } else {
      body.style.overflow = previous || '';
    }

    return () => {
      body.style.overflow = previous || '';
    };
  }, [mobileFiltersOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchParts([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;

    const fetchParts = async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const data = await searchCatalog(query);
        if (!cancelled) {
          setSearchParts(Array.isArray(data.parts) ? data.parts : []);
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Search page API error', error);
        setSearchError('Не удалось выполнить поиск. Попробуйте позже.');
        setSearchParts([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    };

    fetchParts();

    return () => {
      cancelled = true;
    };
  }, [query]);

  const productsToShow: CartProduct[] = useMemo(() => {
    if (searchParts.length === 0) return allProducts;

    return searchParts.map((part, index) => ({
      id: index + 1,
      name: part.name || part.number,
      description: part.number,
      price: 0,
      img: 'product-img.png',
    }));
  }, [searchParts]);

  const Filters = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Сортировать по
      </h2>

      {/* Brands */}
      <section className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
        <button
          type="button"
          onClick={() => toggleSection('brands')}
          className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 pb-2"
        >
          <span>Бренды</span>
          <i
            className={`fa-solid fa-chevron-down text-xs transition-transform ${
              openSections.includes('brands') ? 'rotate-180' : ''
            }`}
          />
        </button>
        {openSections.includes('brands') && (
          <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100">
              <input
                type="text"
                placeholder="Поиск по брендам"
                className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 outline-none"
              />
            </div>
            <div className="max-h-40 overflow-auto py-2">
              {BRANDS.map((brand) => {
                const checked = selectedBrands.includes(brand);
                return (
                  <label
                    key={brand}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-800 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={checked}
                      onChange={() =>
                        toggleFromList(brand, selectedBrands, setSelectedBrands)
                      }
                    />
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] transition-all duration-150 ${
                        checked
                          ? 'bg-[#E21321] border-[#E21321] scale-100'
                          : 'bg-white border-gray-300 scale-95'
                      }`}
                    >
                      <i
                        className={`fa-solid fa-check text-white transition-opacity duration-150 ${
                          checked ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    </span>
                    <span>{brand}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Viscosity */}
      <section className="border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => toggleSection('viscosity')}
          className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 pb-2"
        >
          <span>Вязкость</span>
          <i
            className={`fa-solid fa-chevron-down text-xs transition-transform ${
              openSections.includes('viscosity') ? 'rotate-180' : ''
            }`}
          />
        </button>
        {openSections.includes('viscosity') && (
          <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100 pb-2">
              <input
                type="text"
                placeholder="Вязкость"
                className="w-full h-8 px-2 text-xs rounded-lg border border-gray-200 outline-none"
              />
            </div>
            <div className="max-h-40 overflow-auto py-2">
              {VISCOSITIES.map((v) => {
                const checked = selectedViscosities.includes(v);
                return (
                  <label
                    key={v}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-800 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={checked}
                      onChange={() =>
                        toggleFromList(
                          v,
                          selectedViscosities,
                          setSelectedViscosities
                        )
                      }
                    />
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center text-[9px] transition-all duration-150 ${
                        checked
                          ? 'bg-[#E21321] border-[#E21321] scale-100'
                          : 'bg-white border-gray-300 scale-95'
                      }`}
                    >
                      <i
                        className={`fa-solid fa-check text-white transition-opacity duration-150 ${
                          checked ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    </span>
                    <span>{v}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Simple accordion sections */}
      {[
        'Состав масла',
        'Спецификация API',
        'Спецификация ACEA',
        'Объём, л',
        'Тип ёмкости',
      ].map((title) => {
        const key = title;
        const isVolume = title === 'Объём, л';
        return (
          <section key={key} className="border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => toggleSection(key)}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 pb-2"
            >
              <span>{title}</span>
              <i
                className={`fa-solid fa-chevron-down text-xs transition-transform ${
                  openSections.includes(key) ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openSections.includes(key) && isVolume && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={0.1}
                  max={1000}
                  step={0.1}
                  placeholder="0.1"
                  className="w-24 h-9 px-2 rounded-lg border border-gray-200 text-xs outline-none"
                />
                <span className="text-gray-400 text-xs">—</span>
                <input
                  type="number"
                  min={0.1}
                  max={1000}
                  step={0.1}
                  placeholder="1000"
                  className="w-24 h-9 px-2 rounded-lg border border-gray-200 text-xs outline-none"
                />
              </div>
            )}
          </section>
        );
      })}

      {isMobile && (
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(false)}
          className="mt-6 w-full h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
        >
          Применить фильтры
        </button>
      )}
    </>
  );

  return (
    <MainTemplate>
      <div className="wrapper py-8 flex flex-col lg:flex-row gap-8 items-start">
        {/* Mobile filter button */}
        <div className="flex lg:hidden justify-end mb-2">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 bg-white shadow-sm"
          >
            <i className="fa-solid fa-filter text-xs" />
            Фильтры
          </button>
        </div>

        {/* Desktop Filters */}
        <aside className="hidden lg:block w-full lg:w-[280px] bg-white rounded-3xl shadow-xl px-6 py-6 flex-shrink-0">
          <Filters />
        </aside>

        {/* Results */}
        <section className="flex-1 w-full">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
            Результаты поиска
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {query
              ? `Запрос: «${query}»`
              : `Найдено товаров: ${productsToShow.length}`}
          </p>

          {searchLoading && (
            <p className="text-sm text-gray-500 mb-4">Идёт поиск запчастей…</p>
          )}
          {searchError && !searchLoading && (
            <p className="text-sm text-red-500 mb-4">{searchError}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 w-full">
            {productsToShow.map((product) => (
              <div
                key={product.id}
                className="relative flex flex-col rounded-xl bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="absolute top-2 left-2 inline-flex items-center justify-center px-2 py-1 rounded-full bg-red-600 text-white text-[11px] font-semibold z-10">
                  -20%
                </span>

                <button
                  type="button"
                  onClick={() => toggleFavorite(product.id)}
                  className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/80 shadow flex items-center justify-center z-10 hover:scale-105 transition-transform"
                >
                  <i
                    className={
                      favorites.includes(product.id)
                        ? 'fa-solid fa-heart text-[#E21321] text-sm'
                        : 'fa-regular fa-heart text-gray-400 text-sm'
                    }
                  />
                </button>

                <Link
                  href={ROUTES.PRODUCT(product.id)}
                  className="flex p-2 mb-2 min-h-[140px] items-center justify-center"
                >
                  <Image
                    src={`/img/${product.img}`}
                    alt={product.name}
                    width={200}
                    height={200}
                    className="w-full object-contain"
                  />
                </Link>

                <Link
                  href={ROUTES.PRODUCT(product.id)}
                  className="text-sm font-medium text-gray-900 mb-1 hover:text-[#E21321] transition-colors"
                >
                  {product.name}
                </Link>

                {product.price > 0 && (
                  <span className="text-lg font-semibold text-gray-900">
                    {product.price.toLocaleString('ru-RU')} AMD
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => openModal(product)}
                  className="mt-3 h-11 w-full rounded-xl bg-[#E21321] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#c41020] transition-colors"
                >
                  <i className="fa-solid fa-cart-shopping" />
                  Добавить в корзину
                </button>
              </div>
            ))}
          </div>
        </section>

        <AddToCartModal
          isOpen={!!modalProduct}
          onClose={closeModal}
          product={modalProduct}
        />

        {/* Mobile Filters Modal */}
        {mobileFiltersOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center sm:justify-center transition-opacity duration-200 ease-out"
            onClick={() => setMobileFiltersOpen(false)}
          >
            <div
              className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl px-6 py-6 shadow-xl max-h-[80vh] overflow-y-auto overflow-x-hidden transform translate-y-0 animate-[slideUp_0.2s_ease-out]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">
                  Фильтры
                </h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <i className="fa-solid fa-xmark text-sm" />
                </button>
              </div>

              <Filters isMobile />
            </div>
          </div>
        )}
      </div>
    </MainTemplate>
  );
}
