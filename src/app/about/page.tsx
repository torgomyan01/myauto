import type { Metadata } from 'next';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import MainTemplate from '@/components/layout/main-template/MainTemplate';

export const metadata: Metadata = {
  title: 'О компании Myauto.am',
  description:
    'Узнайте больше о Myauto.am — современном маркетплейсе автозапчастей в Армении.',
};

export default function AboutPage() {
  return (
    <MainTemplate>
      <section className="bg-slate-50/60 py-8 md:py-12">
        <div className="wrapper">
          <div className="mb-6 text-sm text-slate-500">
            <Link href={ROUTES.HOME} className="hover:text-[#E21321]">
              Главная
            </Link>{' '}
            / <span className="text-slate-700">О компании</span>
          </div>

          <div className="mx-auto max-w-4xl rounded-3xl bg-white px-6 py-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:px-10 md:py-10">
            <h1 className="mb-3 text-[26px] font-semibold text-slate-900 md:mb-4 md:text-3xl">
              О компании Myauto.am
            </h1>
            <p className="mb-8 text-sm text-slate-500 md:text-base">
              Современный маркетплейс автозапчастей в Армении
            </p>

            <div className="space-y-4 text-[15px] leading-relaxed text-slate-800 md:text-base">
              <p>
                Myauto.am — это современный маркетплейс автозапчастей, который
                объединяет поставщиков из Китая, России и Армении на одной
                платформе. Мы создали удобную цифровую экосистему, где частные
                автовладельцы, автосервисы и компании могут быстро находить,
                сравнивать и заказывать автозапчасти по лучшим ценам.
              </p>
              <p>
                Наша платформа предлагает широкий ассортимент товаров:
                оригинальные и аналоговые запчасти, расходные материалы, масла,
                фильтры, кузовные элементы, электронику и комплектующие для
                большинства марок автомобилей.
              </p>
              <p>
                Главная миссия Myauto.am — упростить процесс покупки
                автозапчастей. Благодаря интеллектуальному поиску по VIN и
                OEM-номеру пользователи могут находить нужные детали за
                считанные минуты, сравнивать предложения от разных продавцов и
                выбирать оптимальный вариант.
              </p>

              <div className="my-4 h-px w-full bg-slate-100" />

              <p>
                Мы работаем только с проверенными поставщиками и
                производителями, обеспечивая качество, прозрачность и
                надежность на каждом этапе — от выбора товара до доставки.
              </p>
              <p>
                Myauto.am активно сотрудничает с автосервисами, магазинами
                автозапчастей и корпоративными клиентами, предлагая выгодные
                условия, оптовые цены и персональную поддержку.
              </p>
              <p>
                Сегодня Myauto.am — это надежный партнер для всех, кто ищет
                удобный, быстрый и безопасный способ покупки автозапчастей в
                Армении.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MainTemplate>
  );
}
