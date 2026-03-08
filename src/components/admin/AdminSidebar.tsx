'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { useState } from 'react';

const menuItems = [
  {
    label: 'Главная',
    href: ROUTES.ADMIN,
    icon: 'fa-chart-simple',
  },
  {
    label: 'Пользователи',
    href: ROUTES.ADMIN_USERS,
    icon: 'fa-users',
  },
  {
    label: 'Ир. лица',
    href: ROUTES.ADMIN_LEGAL_ENTITIES,
    icon: 'fa-clipboard-check',
  },
  {
    label: 'Настройки',
    icon: 'fa-gear',
    children: [
      { label: 'Общие', href: ROUTES.ADMIN_SETTINGS },
    ],
  },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Настройки: true,
  });

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-700/80 bg-zinc-900 shadow-xl">
      {/* Logo / Brand */}
      <div className="flex shrink-0 items-center gap-3 border-b border-zinc-700/80 px-5 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 shadow-inner">
          <i
            className="fa-solid fa-shield-halved text-sm text-white"
            aria-hidden
          />
        </span>
        <Link
          href={ROUTES.ADMIN}
          className="text-lg font-semibold tracking-tight text-white transition-colors hover:text-white/90"
        >
          MyAuto Admin
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            if ('children' in item && item.children) {
              const isOpen = openSections[item.label] ?? false;
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => toggleSection(item.label)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-zinc-300 outline-none transition-all duration-200 hover:bg-zinc-800/80 hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-800/80 text-zinc-400 transition-colors">
                      <i
                        className={`fa-solid ${item.icon} text-sm`}
                        aria-hidden
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {item.label}
                    </span>
                    <i
                      className={`fa-solid fa-chevron-down shrink-0 text-xs text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                  </button>
                  <ul
                    className={`overflow-hidden transition-all duration-200 ease-out ${isOpen ? 'mt-1 max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    {item.children.map((child) => {
                      const isActive = pathname === child.href;
                      return (
                        <li
                          key={`${item.label}-${child.href}-${child.label}`}
                          className="border-l-2 border-zinc-700/80 pl-4 ml-6"
                        >
                          <Link
                            href={child.href}
                            className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
                            }`}
                          >
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            }
            const href = 'href' in item ? item.href : '#';
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-100'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
                      isActive ? 'bg-white/20' : 'bg-zinc-800/80 text-zinc-400'
                    }`}
                  >
                    <i
                      className={`fa-solid ${item.icon} text-sm`}
                      aria-hidden
                    />
                  </span>
                  <span className="min-w-0 truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Back to site */}
      <div className="shrink-0 border-t border-zinc-700/80 p-3">
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 outline-none transition-colors duration-200 hover:bg-zinc-800/80 hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-blue-500/50"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-800/80">
            <i className="fa-solid fa-arrow-left text-xs" aria-hidden />
          </span>
          Сайт
        </Link>
      </div>
    </aside>
  );
}
