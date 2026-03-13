import MainTemplate from '@/components/layout/main-template/MainTemplate';
import ProductDetails, {
  type ProductData,
} from '@/components/product/product-details/ProductDetails';
import RelatedProducts from '@/components/product/related-products/RelatedProducts';
import { getAutopiterPriceByArticleId } from '@/lib/autopiter';

const getMockProduct = (id: string): ProductData => ({
  id: Number(id),
  sku: 'Hepu P999G12SUPERPLUS',
  name: 'Hepu P999G12SUPERPLUS',
  price: 6500,
  stock: 10,
  deliveryLabel: 'Сегодня',
  images: [
    'product-img.png',
    'product-img.png',
    'product-img.png',
    'product-img.png',
    'product-img.png',
    'product-img.png',
    'product-img.png',
  ],
  specs: [
    { label: 'Бренд', value: 'HEPU' },
    { label: 'Объем, л', value: '1.5' },
    { label: 'Индекс допуска VAG', value: 'G11' },
    { label: 'Область применения', value: 'Система охлаждения', bold: true },
    { label: 'Сезонность', value: 'На любой сезон', bold: true },
    { label: 'Страна-изготовитель', value: 'Германия', bold: true },
    { label: 'Цвет', value: 'красный', bold: true },
  ],
});

function getDeliveryLabel(deliveryDateRaw: string, isToday: boolean): string {
  if (isToday) return 'Сегодня';
  if (!deliveryDateRaw) return 'Уточняйте сроки доставки';

  const parsed = new Date(deliveryDateRaw);
  if (Number.isNaN(parsed.getTime())) {
    return `Дата доставки: ${deliveryDateRaw}`;
  }

  return `Доставка: ${parsed.toLocaleDateString('ru-RU')}`;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const articleId = Number(id);
  let product: ProductData = getMockProduct(id);

  if (Number.isFinite(articleId) && articleId > 0) {
    const prices = await getAutopiterPriceByArticleId(articleId);
    const first = prices[0];

    if (first) {
      const stock = first.NumberOfAvailable && first.NumberOfAvailable > 0
        ? first.NumberOfAvailable
        : 1;
      const sku = first.Number || String(articleId);
      const name =
        first.Name?.trim() || `${first.CatalogName || 'Autopiter'} ${sku}`.trim();

      product = {
        id: articleId,
        sku,
        name,
        price: Number.isFinite(first.SalePrice) ? first.SalePrice : 0,
        stock,
        deliveryLabel: getDeliveryLabel(first.DeliveryDate, first.IsToday),
        images: ['product-img.png'],
        specs: [
          { label: 'Каталог', value: first.CatalogName || '—' },
          { label: 'Артикул', value: first.Number || '—', bold: true },
          { label: 'Поставщик ID', value: String(first.SellerId) },
          { label: 'Регион', value: first.Region || '—' },
          {
            label: 'Рейтинг продаж',
            value:
              first.SalesRating != null ? String(first.SalesRating) : '—',
          },
          {
            label: 'Статус поставщика',
            value: first.NameStatus || '—',
          },
        ],
      };
    }
  }

  return (
    <MainTemplate>
      <div className="wrapper py-8 flex flex-col gap-10">
        <ProductDetails product={product} />
        <RelatedProducts />
      </div>
    </MainTemplate>
  );
}
