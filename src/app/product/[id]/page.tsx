import MainTemplate from '@/components/layout/main-template/MainTemplate';
import ProductDetails, {
  type ProductData,
} from '@/components/product/product-details/ProductDetails';
import RelatedProducts from '@/components/product/related-products/RelatedProducts';

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

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getMockProduct(id);

  return (
    <MainTemplate>
      <div className="wrapper py-8 flex flex-col gap-10">
        <ProductDetails product={product} />
        <RelatedProducts />
      </div>
    </MainTemplate>
  );
}
