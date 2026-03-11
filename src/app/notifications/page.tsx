import type { Metadata } from 'next';
import Link from 'next/link';
import MainTemplate from '@/components/layout/main-template/MainTemplate';
import { ROUTES } from '@/constants/routes';
import { getMyNotifications } from '@/app/actions/notifications';

export const metadata: Metadata = {
  title: 'Уведомления | MyAuto',
  description: 'Уведомления о заказах, верификации и состоянии аккаунта на MyAuto.',
};

export default async function NotificationsPage() {
  const notifications = await getMyNotifications();

  return (
    <MainTemplate>
      <section className="bg-slate-50/60 py-6 md:py-8">
        <div className="wrapper">
          <div className="mb-4 text-xs text-slate-500 md:mb-6">
            <Link href={ROUTES.HOME} className="hover:text-[#E21321]">
              Главная
            </Link>{' '}
            / <span className="text-slate-700">Уведомления</span>
          </div>

          <div className="mx-auto max-w-3xl rounded-2xl bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:rounded-3xl md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3 md:mb-6">
              <div>
                <h1 className="text-lg font-semibold text-slate-900 md:text-2xl">
                  Уведомления
                </h1>
                <p className="mt-1 text-xs text-slate-500 md:text-sm">
                  Сообщения о заказах, верификации и состоянии аккаунта.
                </p>
              </div>
            </div>

            {notifications.length === 0 ? (
              <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                У вас пока нет уведомлений.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((notification) => {
                  const created = new Date(notification.createdAt);
                  const timeLabel = created.toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const statusStyles =
                    notification.status === 'success'
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                      : notification.status === 'warning'
                        ? 'bg-amber-50 text-amber-700 ring-amber-100'
                        : 'bg-rose-50 text-rose-700 ring-rose-100';

                  const statusLabel =
                    notification.status === 'success'
                      ? 'Успешно'
                      : notification.status === 'warning'
                        ? 'Внимание'
                        : 'Ошибка';

                  return (
                    <li key={notification.id} className="px-2 py-3 md:px-3 md:py-3.5">
                      <Link
                        href={notification.href ?? '#'}
                        className="flex gap-3 rounded-xl px-2 py-1.5 text-sm transition-colors hover:bg-slate-50"
                      >
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[16px] ring-1 ${statusStyles}`}
                        >
                          <i
                            className={
                              notification.status === 'success'
                                ? 'fa-regular fa-circle-check'
                                : notification.status === 'warning'
                                  ? 'fa-regular fa-triangle-exclamation'
                                  : 'fa-regular fa-circle-xmark'
                            }
                            aria-hidden
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="truncate text-[13px] font-medium text-slate-900 md:text-sm">
                              {notification.title}
                            </span>
                            <span
                              className={`inline-flex rounded-full px-2 py-[2px] text-[10px] font-semibold uppercase ${statusStyles}`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <p className="mb-1 text-[12px] text-slate-600 md:text-[13px]">
                            {notification.message}
                          </p>
                          <span className="text-[11px] text-slate-400">{timeLabel}</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </MainTemplate>
  );
}

