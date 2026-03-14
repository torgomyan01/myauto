import Link from 'next/link';
import MainTemplate from '@/components/layout/main-template/MainTemplate';
import { ROUTES } from '@/constants/routes';
import {
  getAutopiterPriceByArticleId,
  searchAutopiterByNumber,
} from '@/lib/autopiter';
import AutopiterProductActions from '@/components/autopiter/AutopiterProductActions';

function formatDate(dateRaw: string): string {
  if (!dateRaw) return '—';
  const date = new Date(dateRaw);
  if (Number.isNaN(date.getTime())) return dateRaw;
  return date.toLocaleDateString('ru-RU');
}

export default async function AutopiterProductPage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  const { articleId } = await params;
  const parsedArticleId = Number(articleId);
  const offers = Number.isFinite(parsedArticleId)
    ? await getAutopiterPriceByArticleId(parsedArticleId)
    : [];
  const bestOffer = offers[0];
  const relatedCatalog =
    bestOffer?.Number && String(bestOffer.Number).trim()
      ? await searchAutopiterByNumber(String(bestOffer.Number))
      : [];
  const deliveryDays = offers
    .map((o) => o.NumberOfDaysSupply)
    .filter((d): d is number => typeof d === 'number' && d >= 0);
  const fastestDeliveryDays =
    deliveryDays.length > 0 ? Math.min(...deliveryDays) : null;

  return (
    <MainTemplate>
      <div className="wrapper py-8">
        <div className="mb-5">
          <Link
            href={`${ROUTES.SEARCH}?q=${bestOffer?.Number}`}
            className="text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            ← Назад к поиску
          </Link>
        </div>

        <h1 className="mb-2 text-2xl font-semibold text-gray-900">
          Деталь {bestOffer?.Name ? `: ${bestOffer.Name}` : ''}
        </h1>
        <p className="mb-6 text-sm text-gray-500">ArticleId: {articleId}</p>
        {Number.isFinite(parsedArticleId) && (
          <AutopiterProductActions articleId={parsedArticleId} />
        )}

        {offers.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-500 shadow-sm">
            По этой детали нет предложений.
          </div>
        )}

        {offers.length > 0 && (
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="text-xs text-gray-500">Предложений</div>
              <div className="text-xl font-semibold text-gray-900">
                {offers.length}
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="text-xs text-gray-500">Цена детали</div>
              <div className="text-xl font-semibold text-gray-900">
                {bestOffer
                  ? `${bestOffer.SalePrice.toLocaleString('ru-RU')} ${
                      bestOffer.CurrencyName || 'RUB'
                    }`
                  : '—'}
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="text-xs text-gray-500">Быстрейшая доставка</div>
              <div className="text-xl font-semibold text-gray-900">
                {fastestDeliveryDays != null
                  ? `${fastestDeliveryDays} дн.`
                  : '—'}
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="text-xs text-gray-500">Доставка</div>
              <div className="text-xl font-semibold text-gray-900">
                7 - 12 дней
              </div>
            </div>
          </div>
        )}

        {bestOffer && (
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-base font-semibold text-gray-900">
              Основная информация
            </h2>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 md:grid-cols-2">
              <div>
                <span className="text-gray-500">Номер:</span> {bestOffer.Number}
              </div>
              <div>
                <span className="text-gray-500">Каталог:</span>{' '}
                {bestOffer.CatalogName || '—'}
              </div>
              <div className="md:col-span-2">
                <span className="text-gray-500">Наименование:</span>{' '}
                {bestOffer.Name || '—'}
              </div>
              <div>
                <span className="text-gray-500">Рейтинг:</span>{' '}
                {bestOffer.SalesRating ?? '—'}
              </div>
              <div>
                <span className="text-gray-500">Статус поставщика:</span>{' '}
                {bestOffer.NameStatus || '—'}
              </div>
              <div>
                <span className="text-gray-500">Лучшая цена:</span>{' '}
                {bestOffer.SalePrice.toLocaleString('ru-RU')}{' '}
                {bestOffer.CurrencyName}
              </div>
              <div>
                <span className="text-gray-500">Регион:</span>{' '}
                {bestOffer.Region || '—'}
              </div>
              <div>
                <span className="text-gray-500">Дней доставки:</span>{' '}
                {bestOffer.NumberOfDaysSupply ?? '—'}
              </div>
              <div>
                <span className="text-gray-500">Дата доставки:</span>{' '}
                {formatDate(bestOffer.DeliveryDate)}
              </div>
              <div>
                <span className="text-gray-500">Наличие:</span>{' '}
                {bestOffer.NumberOfAvailable ?? '—'}
              </div>
              <div>
                <span className="text-gray-500">Min кол-во:</span>{' '}
                {bestOffer.MinNumberOfSales ?? '—'}
              </div>
              <div>
                <span className="text-gray-500">Номер замены:</span>{' '}
                {bestOffer.NumberChange || '—'}
              </div>
              <div>
                <span className="text-gray-500">TypeRefusal:</span>{' '}
                {bestOffer.TypeRefusal ?? '—'}
              </div>
              <div>
                <span className="text-gray-500">Successful %:</span>{' '}
                {bestOffer.SuccessfulOrdersProcent ?? '—'}
              </div>
              <div>
                <span className="text-gray-500">RealTimeInProc %:</span>{' '}
                {bestOffer.RealTimeInProc ?? '—'}
              </div>
              <div>
                <span className="text-gray-500">StoreType:</span>{' '}
                {bestOffer.StoreType ?? '—'}
              </div>
              <div>
                <span className="text-gray-500">DetailUid:</span>{' '}
                {bestOffer.DetailUid || '—'}
              </div>
              <div>
                <span className="text-gray-500">IsExpress:</span>{' '}
                {bestOffer.IsExpress ? 'Да' : 'Нет'}
              </div>
              <div>
                <span className="text-gray-500">IsToday:</span>{' '}
                {bestOffer.IsToday ? 'Да' : 'Нет'}
              </div>
              <div>
                <span className="text-gray-500">IsSearchNum:</span>{' '}
                {bestOffer.IsSearchNum ? 'Да' : 'Нет'}
              </div>
              <div>
                <span className="text-gray-500">IsDimension:</span>{' '}
                {bestOffer.IsDimension ? 'Да' : 'Нет'}
              </div>
              <div>
                <span className="text-gray-500">Надёжный поставщик:</span>{' '}
                {bestOffer.IsReliableSupplier ? 'Да' : 'Нет'}
              </div>
            </div>
          </div>
        )}

        {relatedCatalog.length > 0 && (
          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-gray-900">
              Связанные каталоги
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2">ArticleId</th>
                    <th className="px-3 py-2">Номер</th>
                    <th className="px-3 py-2">Наименование</th>
                    <th className="px-3 py-2">Каталог</th>
                    <th className="px-3 py-2">Рейтинг</th>
                    <th className="px-3 py-2">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedCatalog.slice(0, 20).map((item) => (
                    <tr
                      key={`${item.ArticleId}-${item.CatalogName}-${item.Number}`}
                      className="border-t border-gray-100"
                    >
                      <td className="px-3 py-2">{item.ArticleId}</td>
                      <td className="px-3 py-2">{item.Number}</td>
                      <td className="px-3 py-2">{item.Name}</td>
                      <td className="px-3 py-2">{item.CatalogName}</td>
                      <td className="px-3 py-2">{item.SalesRating}</td>
                      <td className="px-3 py-2">
                        <Link
                          href={ROUTES.AUTOPITER_PRODUCT(item.ArticleId)}
                          className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Открыть
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainTemplate>
  );
}
