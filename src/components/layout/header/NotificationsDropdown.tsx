'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ROUTES } from '@/constants/routes';

type NotificationStatus = 'success' | 'warning' | 'error';

interface NotificationItem {
  id: string;
  status: NotificationStatus;
  title: string;
  message: string;
  href?: string;
  image?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function NotificationsDropdown({
  isOpen,
  onToggle,
}: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = (payload: {
    status: NotificationStatus;
    title: string;
    message: string;
    href?: string;
    image?: string;
  }) => {
    setNotifications((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: payload.status,
        title: payload.title,
        message: payload.message,
        href: payload.href,
        image: payload.image,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    }).catch((e) => {
      console.error('Failed to mark all notifications as read', e);
    });
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch((e) => {
      console.error('Failed to mark notification as read', e);
    });
  };

  useEffect(() => {
    // Initial load from API
    const load = async () => {
      try {
        const res = await fetch('/api/notifications', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.notifications)) {
          setNotifications(
            data.notifications.map((n: any) => ({
              id: String(n.id),
              status: n.status as NotificationStatus,
              title: n.title,
              message: n.message,
              href: n.href ?? undefined,
              image: n.image ?? undefined,
              read: Boolean(n.read),
              createdAt: n.createdAt,
            }))
          );
        }
      } catch (e) {
        console.error('Failed to load notifications', e);
      }
    };

    load();

    // Debug helper: allow triggering notifications from console
    (window as any).myautoNotify = (payload: {
      status: NotificationStatus;
      title: string;
      message: string;
      href?: string;
      image?: string;
    }) => addNotification(payload);
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="relative flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[10px] bg-[#f9f9f9] transition-colors hover:bg-[#ececec] max-[1024px]:h-8 max-[1024px]:w-8"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <i
          className="fa-regular fa-bell text-[20px] max-[1024px]:text-base"
          aria-hidden
        />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-h-[18px] min-w-[18px] rounded-full bg-[#E21321] px-1.5 text-center text-[11px] font-semibold leading-[18px] text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={onToggle} aria-hidden />
      )}
      <div
        className={`absolute right-0 top-[calc(100%+8px)] z-50 w-[360px] rounded-2xl border border-zinc-200/80 bg-white/95 py-2 shadow-[0_18px_60px_rgba(15,23,42,0.18)] backdrop-blur-md transition-all duration-200 ${
          isOpen
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-1 scale-95 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-1 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Центр уведомлений
          </span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="text-[11px] font-normal text-[#E21321] hover:underline"
            >
              Очистить ({unreadCount})
            </button>
          )}
        </div>

        <div className="border-y border-zinc-100 bg-zinc-50/60 px-4 py-2 text-[11px] text-zinc-500">
          <span>Здесь появляются важные сообщения по заказам, верификации и аккаунту.</span>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-5 text-sm text-zinc-500">
              Пока что уведомлений нет. Как только появятся новые события, они отобразятся здесь.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100 px-1 pb-1">
              {notifications.map((notification) => {
                const statusStyles =
                  notification.status === 'success'
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                    : notification.status === 'warning'
                      ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
                      : 'bg-rose-50 text-rose-700 ring-1 ring-rose-100';
                const statusLabel =
                  notification.status === 'success'
                    ? 'Успешно'
                    : notification.status === 'warning'
                      ? 'Внимание'
                      : 'Ошибка';

                const created = new Date(notification.createdAt);
                const timeLabel = created.toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <li key={notification.id} className="px-1 py-1">
                    <Link
                      href={notification.href ?? ''}
                      onClick={() => {
                        markNotificationAsRead(notification.id);
                        onToggle();
                      }}
                      className="group flex gap-3 rounded-xl px-2.5 py-2.5 text-left text-sm transition-colors hover:bg-zinc-50"
                    >
                      {notification.image ? (
                        <div className="mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200/60">
                          <Image
                            src={notification.image}
                            alt=""
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[18px] ${
                            notification.status === 'success'
                              ? 'bg-emerald-50 text-emerald-600'
                              : notification.status === 'warning'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-rose-50 text-rose-600'
                          }`}
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
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="truncate text-[13px] font-medium text-zinc-900 group-hover:text-zinc-950">
                            {notification.title}
                          </span>
                          <span
                            className={`hidden rounded-full px-2 py-[2px] text-[10px] font-semibold uppercase md:inline-flex ${statusStyles}`}
                          >
                            {statusLabel}
                          </span>
                          {!notification.read && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#E21321]" />
                          )}
                        </div>
                        <p className="line-clamp-2 text-[12px] text-zinc-600">
                          {notification.message}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-400">
                          <span>{timeLabel}</span>
                          <span>·</span>
                          <span>
                            {notification.status === 'success'
                              ? 'Операция выполнена'
                              : notification.status === 'warning'
                                ? 'Требуется действие'
                                : 'Проблема с обработкой'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
