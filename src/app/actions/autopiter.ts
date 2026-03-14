'use server';

import {
  getAutopiterPriceByArticleId,
  searchAutopiterExactQuery,
  type AutopiterCatalogItem,
  type AutopiterPriceItem,
} from '@/lib/autopiter';

export type AutopiterPrefillPayload = {
  title: string;
  brand: string;
  article: string;
  description: string;
  offer: {
    sellerName: string;
    sku: string;
    price: string;
    currency: 'AMD' | 'RUB' | 'USD' | 'EUR';
    stock: string;
    deliveryDays: string;
  };
  attributes: Array<{ key: string; value: string }>;
};

export type AutopiterPrefillResponse = {
  ok: boolean;
  message?: string;
  prefill?: AutopiterPrefillPayload;
};

function isFilled(value: string | null | undefined): boolean {
  return Boolean(value && value.trim());
}

function scoreCatalogItem(item: AutopiterCatalogItem): number {
  const hasName = isFilled(item.Name) ? 1000 : 0;
  const hasCatalog = isFilled(item.CatalogName) ? 100 : 0;
  const rating = Number.isFinite(item.SalesRating) ? item.SalesRating : 0;
  return hasName + hasCatalog + rating;
}

function sortCatalogItems(items: AutopiterCatalogItem[]): AutopiterCatalogItem[] {
  return [...items].sort((a, b) => {
    const aScore = scoreCatalogItem(a);
    const bScore = scoreCatalogItem(b);
    if (aScore !== bScore) return bScore - aScore;
    return (b.SalesRating ?? 0) - (a.SalesRating ?? 0);
  });
}

function scorePriceItem(item: AutopiterPriceItem): number {
  let score = 0;
  if (isFilled(item.Name)) score += 100;
  if (isFilled(item.CatalogName)) score += 50;
  if (isFilled(item.Number)) score += 40;
  if (isFilled(item.DetailUid)) score += 40;
  if (Number.isFinite(item.SalePrice) && item.SalePrice > 0) score += 40;
  if (item.NumberOfDaysSupply != null) score += 20;
  if (isFilled(item.DeliveryDate)) score += 20;
  if (item.NumberOfAvailable != null) score += 10;
  if (isFilled(item.Region)) score += 10;
  return score;
}

function isPriceItemComplete(item: AutopiterPriceItem): boolean {
  return (
    isFilled(item.Name) &&
    isFilled(item.CatalogName) &&
    isFilled(item.Number) &&
    isFilled(item.DetailUid) &&
    Number.isFinite(item.SalePrice) &&
    item.SalePrice > 0 &&
    (item.NumberOfDaysSupply != null || isFilled(item.DeliveryDate))
  );
}

function pickBestPriceItem(items: AutopiterPriceItem[]): AutopiterPriceItem | undefined {
  if (items.length === 0) return undefined;
  return [...items].sort((a, b) => scorePriceItem(b) - scorePriceItem(a))[0];
}

export async function prefillPartFromAutopiterByOem(
  oemNumber: string
): Promise<AutopiterPrefillResponse> {
  const query = oemNumber.trim();
  if (!query) {
    return { ok: false, message: 'Введите OEM номер.' };
  }

  const catalogItems = await searchAutopiterExactQuery(query);
  if (catalogItems.length === 0) {
    return {
      ok: false,
      message: `По OEM «${query}» ничего не найдено в Autopiter.`,
    };
  }

  const sortedCatalogItems = sortCatalogItems(catalogItems);

  let selectedCatalogItem: AutopiterCatalogItem | undefined;
  let selectedPrice: AutopiterPriceItem | undefined;

  for (const catalogItem of sortedCatalogItems) {
    const priceItems = await getAutopiterPriceByArticleId(catalogItem.ArticleId);
    const bestForThisArticle = pickBestPriceItem(priceItems);
    if (!bestForThisArticle) continue;

    if (!selectedCatalogItem || !selectedPrice) {
      selectedCatalogItem = catalogItem;
      selectedPrice = bestForThisArticle;
    }

    if (isPriceItemComplete(bestForThisArticle)) {
      selectedCatalogItem = catalogItem;
      selectedPrice = bestForThisArticle;
      break;
    }
  }

  if (!selectedCatalogItem || !selectedPrice) {
    return {
      ok: false,
      message: 'Товар найден, но по найденным ArticleId нет пригодных предложений.',
    };
  }

  const currency = (selectedPrice.CurrencyName || 'RUB').toUpperCase();
  const mappedCurrency: 'AMD' | 'RUB' | 'USD' | 'EUR' =
    currency === 'USD' || currency === 'EUR' || currency === 'AMD'
      ? currency
      : 'RUB';

  const number = selectedPrice.Number || String(selectedCatalogItem.Number ?? query);
  const articleId = String(selectedCatalogItem.ArticleId);
  const title = selectedPrice.Name || selectedCatalogItem.Name || number;
  const brand = selectedPrice.CatalogName || selectedCatalogItem.CatalogName || '';

  // eslint-disable-next-line no-console
  console.log('[Autopiter][Prefill] Selected item after sorting/fallback', {
    query,
    selectedArticleId: selectedCatalogItem.ArticleId,
    selectedNumber: selectedCatalogItem.Number,
    selectedCatalogName: selectedCatalogItem.CatalogName,
    catalogItemsCount: catalogItems.length,
    selectedPriceScore: scorePriceItem(selectedPrice),
    selectedIsComplete: isPriceItemComplete(selectedPrice),
  });

  return {
    ok: true,
    prefill: {
      title,
      brand,
      article: articleId,
      description: `${title}${brand ? ` (${brand})` : ''}`,
      offer: {
        sellerName: selectedPrice.NameStatus || `Seller #${selectedPrice.SellerId}`,
        sku: number,
        price: String(selectedPrice.SalePrice || ''),
        currency: mappedCurrency,
        stock:
          selectedPrice.NumberOfAvailable == null
            ? ''
            : String(selectedPrice.NumberOfAvailable),
        deliveryDays:
          selectedPrice.NumberOfDaysSupply == null
            ? ''
            : String(selectedPrice.NumberOfDaysSupply),
      },
      attributes: [
        { key: 'Autopiter: ArticleId', value: String(selectedCatalogItem.ArticleId) },
        { key: 'Autopiter: Номер детали', value: number || '—' },
        { key: 'Autopiter: DetailUid', value: selectedPrice.DetailUid || '—' },
        { key: 'Autopiter: Каталог', value: brand || '—' },
        { key: 'Autopiter: Регион', value: selectedPrice.Region || '—' },
        { key: 'Autopiter: Дата доставки', value: selectedPrice.DeliveryDate || '—' },
      ],
    },
  };
}
