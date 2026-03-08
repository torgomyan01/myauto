'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import styles from './Header.module.scss';
import { ROUTES } from '@/constants/routes';

interface UserDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
}

const iconClass = 'fa-solid w-[22px] mr-[15px] text-center text-[18px]';

export default function UserDropdown({ isOpen, onToggle }: UserDropdownProps) {
  return (
    <div className={styles.user}>
      <button
        type="button"
        className={`${styles.icon} flex-jc-c`}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <i className="fa-regular fa-user text-[20px]" />
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={onToggle} aria-hidden />
      )}
      <div
        className={`${styles.basketInfoHide} ${isOpen ? styles.show : ''} z-50`}
      >
        <Link href={ROUTES.PROFILE}>
          <i className={`${iconClass} fa-user`} />
          Личные данные
        </Link>
        <Link href={ROUTES.GARAGE}>
          <i className={`${iconClass} fa-car`} />
          Мой гараж
        </Link>
        <a href="#">
          <i className={`${iconClass} fa-bullhorn`} />
          Мои объявления
        </a>
        <a href="#">
          <i className={`${iconClass} fa-clipboard-list`} />
          Мои заказы
        </a>
        <a href="#">
          <i className={`${iconClass} fa-heart`} />
          Избранное
        </a>
        <a href="#">
          <i className={`${iconClass} fa-key`} />
          пароль
        </a>
        <a href="#">
          <i className={`${iconClass} fa-clock-rotate-left`} />
          История заказов
        </a>
        <a
          href="#"
          role="button"
          onClick={(e) => {
            e.preventDefault();
            onToggle();
            signOut({ callbackUrl: ROUTES.HOME });
          }}
        >
          <i className={`${iconClass} fa-right-from-bracket`} />
          Выход
        </a>
      </div>
    </div>
  );
}
