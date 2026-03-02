'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import { SelectItem, Select } from '@heroui/react';
import styles from './Header.module.scss';
import { ROUTES } from '@/constants/routes';

export default function Header() {
  const [searchValue, setSearchValue] = useState('');
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [lang, setLang] = useState('ru');
  const formRef = useRef<HTMLDivElement>(null);

  const iconsWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setShowSearchDrop(false);
      }
      if (
        iconsWrapRef.current &&
        !iconsWrapRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const toggleDropdown = (name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  return (
    <header className={styles.header}>
      <div className="wrapper">
        <div className={styles.headerInfo}>
          <Link href={ROUTES.HOME} className={styles.logo}>
            <Image src="/img/logo.svg" alt="MyAuto" width={160} height={40} />
          </Link>

          <div className={styles.formWrap} ref={formRef}>
            <form onSubmit={(e) => e.preventDefault()}>
              <input
                type="text"
                placeholder="Введите VIN, номер или название детали"
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setShowSearchDrop(e.target.value.trim().length > 0);
                }}
              />
              <button type="button" className={styles.searchBtn}>
                <Image
                  src="/img/search-icon.svg"
                  alt="search"
                  width={18}
                  height={18}
                />
              </button>
            </form>

            <div
              className={`${styles.formHideContent} ${showSearchDrop ? styles.show : ''}`}
            >
              <div className={styles.topLine}>
                <div className="checkbox-wrap">
                  <label>
                    <input type="checkbox" />
                    <span></span>
                    Искать детали для авто из гаража
                  </label>
                </div>
                <span className={styles.marka}>INFINITI QX70/FX</span>
              </div>
              <div className={styles.info}>
                {[1, 2, 3, 4].map((i) => (
                  <div className={styles.infoLine} key={i}>
                    <Image
                      src="/img/clock-icon.svg"
                      alt=""
                      width={16}
                      height={16}
                    />
                    <b>055785215</b>
                    <span>INFINITI</span>
                  </div>
                ))}
                {[1, 2].map((i) => (
                  <div className={styles.info2Line} key={i}>
                    <div className={styles.imgWrap}>
                      <Image
                        src="/img/form-info-img.png"
                        alt=""
                        width={40}
                        height={40}
                      />
                    </div>
                    <div className={styles.texts}>
                      <b>INFINITI 055785215</b>
                      <span>Тормозные колодки (задний мост)</span>
                    </div>
                    <span className={styles.price}>3000 AMD</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.iconsWrap} ref={iconsWrapRef}>
            <div className={styles.basket}>
              <Link href={ROUTES.CART} className={styles.icon}>
                <Image
                  src="/img/header-icon1.svg"
                  alt=""
                  width={22}
                  height={22}
                />
                <span className={styles.count}>3</span>
              </Link>
            </div>

            <div className={styles.user}>
              <Link href={ROUTES.LOGIN} className={styles.icon}>
                <Image
                  src="/img/header-icon2.svg"
                  alt=""
                  width={22}
                  height={22}
                />
              </Link>
            </div>

            <div className={styles.cars}>
              <div
                className={styles.icon}
                onClick={() => toggleDropdown('cars')}
              >
                <Image
                  src="/img/header-icon3.svg"
                  alt=""
                  width={22}
                  height={22}
                />
              </div>
              <div
                className={`${styles.carsInfoHide} ${openDropdown === 'cars' ? styles.show : ''}`}
              >
                Добавьте автомобили в свой гараж, чтобы быстро найти нужные
                детали.
              </div>
            </div>

            <div className={styles.add}>
              <div
                className={styles.icon}
                onClick={() => toggleDropdown('add')}
              >
                <Image
                  src="/img/header-icon4.svg"
                  alt=""
                  width={22}
                  height={22}
                />
              </div>
              <div
                className={`${styles.addInfoHide} ${openDropdown === 'add' ? styles.show : ''}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.addInfo}>
                  <b>Добавить автомобиль</b>
                  <input
                    type="text"
                    placeholder="VIN-номер, код или номер кузова"
                  />
                  <button className="red-btn">Добавить</button>
                </div>
              </div>
            </div>
          </div>

          <Select
            defaultSelectedKeys={['ru']}
            size="sm"
            variant="flat"
            className="w-[90px]"
            classNames={{
              trigger: 'h-[40px]',
            }}
          >
            <SelectItem key="ru">РУ</SelectItem>
            <SelectItem key="en">EN</SelectItem>
          </Select>
        </div>
      </div>
    </header>
  );
}
