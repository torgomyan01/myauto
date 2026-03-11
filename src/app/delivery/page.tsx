import type { Metadata } from 'next';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import MainTemplate from '@/components/layout/main-template/MainTemplate';

export const metadata: Metadata = {
  title: 'Условия и сроки доставки | Myauto.am',
  description:
    'Подробная информация об условиях и сроках доставки автозапчастей на Myauto.am.',
};

export default function DeliveryTermsPage() {
  return (
    <MainTemplate>
      <section className="bg-slate-50/60 py-8 md:py-12">
        <div className="wrapper">
          <div className="mb-6 text-sm text-slate-500">
            <Link href={ROUTES.HOME} className="hover:text-[#E21321]">
              Главная
            </Link>{' '}
            / <span className="text-slate-700">Условия и сроки доставки</span>
          </div>

          <div className="mx-auto max-w-4xl rounded-3xl bg-white px-6 py-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:px-10 md:py-10">
            <h1 className="mb-3 text-[26px] font-semibold text-slate-900 md:mb-4 md:text-3xl">
              Условия и сроки доставки
            </h1>
            <p className="mb-8 text-sm text-slate-500 md:text-base">
              Информация о сроках и особенностях доставки заказов Myauto.am
            </p>

            <div className="space-y-6 text-[15px] leading-relaxed text-slate-800 md:text-base">
              <p>
                Myauto.am обеспечивает надежную и своевременную доставку
                автозапчастей из Китая 🇨🇳, России 🇷🇺 и Армении 🇦🇲. Мы
                сотрудничаем с проверенными логистическими партнерами и
                контролируем каждый этап доставки — от отправки до получения.
              </p>

              <div>
                <h2 className="mb-2 text-lg font-semibold text-slate-900">
                  Международная доставка
                </h2>
                <div className="space-y-2 rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="font-medium text-slate-900">
                    Китай → Армения
                  </p>
                  <p>
                    Срок доставки составляет в среднем до 24 дней с момента
                    подтверждения заказа и отправки товара поставщиком.
                  </p>
                </div>
                <div className="mt-3 space-y-2 rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="font-medium text-slate-900">
                    Россия → Армения
                  </p>
                  <p>
                    Срок доставки составляет 12–15 дней с момента отправки.
                  </p>
                </div>
                <div className="mt-3 space-y-2 rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="font-medium text-slate-900">
                    Армения → Россия
                  </p>
                  <p>
                    Срок доставки составляет 12–15 дней в зависимости от региона
                    получателя.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="mb-2 text-lg font-semibold text-slate-900">
                  Важно знать
                </h2>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    Сроки доставки указаны ориентировочно и могут незначительно
                    меняться в зависимости от таможенного оформления, погодных
                    условий и загрузки логистических линий.
                  </li>
                  <li>
                    Отсчет срока начинается после подтверждения заказа и передачи
                    товара в доставку.
                  </li>
                  <li>Мы предоставляем отслеживание заказа на всех этапах.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainTemplate>
  );
}

