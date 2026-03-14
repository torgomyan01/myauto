'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

interface AutopiterProductActionsProps {
  articleId: number;
}

export default function AutopiterProductActions({
  articleId,
}: AutopiterProductActionsProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setIsFavorite((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50"
      >
        <i
          className={isFavorite ? 'fa-solid fa-heart text-[#E21321]' : 'fa-regular fa-heart'}
          aria-hidden
        />
        {isFavorite ? 'В избранном' : 'В избранное'}
      </button>

      <button
        type="button"
        onClick={() =>
          router.push(`${ROUTES.CART}?autopiterArticleId=${encodeURIComponent(String(articleId))}`)
        }
        className="inline-flex items-center gap-2 rounded-lg bg-[#E21321] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#c41020]"
      >
        <i className="fa-solid fa-cart-shopping" aria-hidden />
        Добавить в корзину
      </button>
    </div>
  );
}
