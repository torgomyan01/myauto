import type { Metadata } from 'next';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import MainTemplate from '@/components/layout/main-template/MainTemplate';

export const metadata: Metadata = {
  title: 'Партнёрам — Myauto.am',
  description:
    'Условия сотрудничества и выплаты для партнёров Myauto.am — поставщиков и дистрибьюторов автозапчастей.',
};

export default function PartnersPage() {
  return (
    <MainTemplate>
      <section className="bg-slate-50/60 py-8 md:py-12">
        <div className="wrapper">
          <div className="mb-6 text-sm text-slate-500">
            <Link href={ROUTES.HOME} className="hover:text-[#E21321]">
              Главная
            </Link>{' '}
            / <span className="text-slate-700">Партнёрам</span>
          </div>

          <div className="mx-auto max-w-4xl rounded-3xl bg-white px-6 py-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:px-10 md:py-10">
            <h1 className="mb-3 text-[26px] font-semibold text-slate-900 md:mb-4 md:text-3xl">
              Партнёрам — Myauto.am
            </h1>
            <p className="mb-8 text-sm text-slate-500 md:text-base">
              Возможности сотрудничества для поставщиков и дистрибьюторов
              автозапчастей.
            </p>

            <div className="space-y-6 text-[15px] leading-relaxed text-slate-800 md:text-base">
              <p>
                Myauto.am — современный маркетплейс автозапчастей, который
                предлагает поставщикам и дистрибьюторам из Армении 🇦🇲, России 🇷🇺
                и Китая 🇨🇳 удобную платформу для продаж, прозрачные условия
                сотрудничества и стабильные выплаты.
              </p>

              <div>
                <h2 className="mb-2 text-lg font-semibold text-slate-900">
                  Что мы предлагаем партнёрам
                </h2>
                <div className="space-y-2 rounded-2xl bg-slate-50 px-4 py-4">
                  <p>Мы создаем эффективную среду для роста продаж и масштабирования бизнеса:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Быстрое подключение и размещение товаров</li>
                    <li>Доступ к широкой аудитории покупателей</li>
                    <li>Удобный личный кабинет продавца</li>
                    <li>Инструменты аналитики и управления ассортиментом</li>
                    <li>Поддержка на всех этапах работы</li>
                    <li>
                      Возможность работы со своего склада (дропшиппинг) или через логистику Myauto
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="mb-2 text-lg font-semibold text-slate-900">
                  Как происходят выплаты
                </h2>
                <p>
                  Выплаты партнёрам на Myauto.am осуществляются по прозрачной модели, применяемой
                  крупнейшими маркетплейсами. Начисления производятся только по фактически выполненным
                  заказам — доставленным и подтвержденным покупателем.
                </p>
                <p className="mt-3">
                  Сумма к выплате рассчитывается следующим образом:
                </p>
                <div className="mt-2 rounded-2xl bg-slate-50 px-4 py-4 text-sm md:text-[15px]">
                  <p>👉 стоимость проданного товара</p>
                  <p>➖ комиссия маркетплейса</p>
                  <p>➖ логистика (если применимо)</p>
                  <p>➖ возвраты и корректировки (при наличии)</p>
                </div>
                <p className="mt-3">
                  Формируется регулярный отчет по продажам, на основании которого производятся выплаты
                  по установленному графику. В среднем цикл выплат составляет до 7 рабочих дней после
                  формирования отчета.
                </p>
                <p className="mt-3">
                  Средства перечисляются на расчетный счет партнера, открытый в банке Армении 🇦🇲,
                  России 🇷🇺 или Китая 🇨🇳.
                </p>
                <p className="mt-3">
                  Мы обеспечиваем полную прозрачность расчетов:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>детализированная финансовая отчетность</li>
                  <li>отображение каждой продажи</li>
                  <li>учет возвратов</li>
                  <li>история выплат в личном кабинете</li>
                </ul>
              </div>

              <div>
                <h2 className="mb-2 text-lg font-semibold text-slate-900">
                  Как это работает
                </h2>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm md:text-[15px]">
                  <p>👉 Партнер размещает товар</p>
                  <p>👉 Покупатель оформляет заказ</p>
                  <p>👉 Заказ доставляется и подтверждается</p>
                  <p>👉 Формируется отчет</p>
                  <p>👉 Производится выплата</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainTemplate>
  );
}

