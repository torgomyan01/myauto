'use client';

import { useState } from 'react';
import PopularBrands from './PopularBrands';

interface BrandsAllProps {
  /** Сегмент каталога из URL: light | heavy | moto — фильтрует марки по категории ACAT */
  segment?: string;
}

const SEGMENT_TITLES: Record<string, string> = {
  light: 'Легковые и мототехника',
  heavy: 'Грузовые, автобусы, спецтехника, двигатели',
  moto: 'Мототехника',
};

export default function BrandsAll({ segment }: BrandsAllProps) {
  const [query, setQuery] = useState('');

  return (
    <div className="flex flex-col gap-5">
      {segment && SEGMENT_TITLES[segment] && (
        <p className="text-sm text-slate-600">
          Категория: <strong>{SEGMENT_TITLES[segment]}</strong>
        </p>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Поиск марки по названию"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3.5 pr-9 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#E21321] focus:ring-1 focus:ring-[#E21321]/40 transition-colors"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
            <i className="fa-solid fa-magnifying-glass" />
          </span>
        </div>
      </div>

      <PopularBrands mode="all" hideTitle searchQuery={query} segment={segment} />
    </div>
  );
}

