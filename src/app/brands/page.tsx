import MainTemplate from '@/components/layout/main-template/MainTemplate';
import BrandsAll from '@/components/home/popular-brands/BrandsAll';

const SEGMENT_TITLES: Record<string, string> = {
  light: 'Легковые и мототехника',
  heavy: 'Грузовые, автобусы, спецтехника',
  moto: 'Мототехника',
};

export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ segment?: string }>;
}) {
  const params = await searchParams;
  const segment = params?.segment;
  const title = segment && SEGMENT_TITLES[segment] ? SEGMENT_TITLES[segment] : 'Все марки';

  return (
    <MainTemplate>
      <div className="wrapper py-8! mt-10">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
          {title}
        </h1>
        <p className="text-sm text-gray-500 mb-6 max-w-xl">
          {segment
            ? 'Марки в выбранной категории каталога. Выберите производителя для подбора запчастей.'
            : 'Здесь собраны все доступные производители из каталога. Выберите интересующую марку, чтобы перейти к подбору запчастей.'}
        </p>
        <BrandsAll segment={segment} />
      </div>
    </MainTemplate>
  );
}
