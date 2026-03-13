'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

interface ProductCardProps {
  id: number;
  number: string;
  name: string;
  catalogName?: string;
  salesRating?: number;
}

export default function ProductCard({
  id,
  number,
  name,
  catalogName,
  salesRating,
}: ProductCardProps) {
  return (
    <Link
      href={ROUTES.PRODUCT(id)}
      className="group flex h-full flex-col rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative mb-3 h-28 w-full overflow-hidden rounded-lg bg-gray-50">
        <Image
          src="/img/product-img.png"
          alt={name}
          fill
          className="object-contain p-2 transition-transform duration-200 group-hover:scale-105"
        />
      </div>

      <div className="mb-1 truncate text-sm font-semibold text-gray-900">
        {number}
      </div>
      <div className="line-clamp-2 min-h-10 text-xs text-gray-600">{name}</div>

      <div className="mt-auto pt-2 text-[11px] text-gray-500">
        {catalogName ? `Каталог: ${catalogName}` : 'Каталог: —'}
      </div>
      {typeof salesRating === 'number' && (
        <div className="pt-1 text-[11px] text-gray-500">
          Рейтинг: {salesRating}/10
        </div>
      )}
    </Link>
  );
}
