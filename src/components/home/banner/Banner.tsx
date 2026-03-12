'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { Autoplay, Pagination } from 'swiper/modules';
import { ROUTES } from '@/constants/routes';
import 'swiper/css';
import 'swiper/css/pagination';

const SLIDES = [
  {
    src: '/img/banner-hero-car.png',
    alt: 'Спортивный автомобиль и запчасти в неоновом стиле',
  },
  {
    src: '/img/banner-hero-engine.jpg',
    alt: 'Двигатель и детали с подсветкой',
  },
  {
    src: '/img/banner-hero-oil.png',
    alt: 'Моторное масло и фильтры для обслуживания авто',
  },
  {
    src: '/img/banner-hero-suspension.png',
    alt: 'Амортизаторы, пружины и элементы подвески',
  },
  {
    src: '/img/banner-hero-brakes.png',
    alt: 'Тормозные диски и колодки премиум‑класса',
  },
  {
    src: '/img/banner-hero-electro.png',
    alt: 'Электрика и свечи зажигания для автомобиля',
  },
] as const;

export default function Banner() {
  const swiperRef = useRef<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const currentCaption = SLIDES[activeIndex]?.alt ?? '';

  return (
    <section className="relative overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-red-600/25 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-red-500/15 blur-3xl" />
      </div>

      <div className="wrapper relative flex flex-col gap-8 py-10! md:flex-row md:items-center md:justify-between md:py-14! lg:py-20!">
        <div className="max-w-xl space-y-4 text-white">
          <p className="inline-flex items-center rounded-full bg-red-600/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-400">
            Быстрый подбор запчастей
          </p>
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl lg:text-5xl">
            Запчасти <span className="text-red-500">в наличии</span> для вашего
            авто уже сегодня
          </h1>
          <p className="max-w-md text-sm text-slate-200/80 md:text-base">
            Введите VIN или номер детали в поиске выше — мы найдём аналоги, цены
            и наличие у проверенных поставщиков.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href={ROUTES.SEARCH}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(248,113,113,0.8)] transition hover:bg-red-500"
            >
              Найти запчасти
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-[11px] text-slate-200/90">
              <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Подбор по VIN, Frame и номеру детали
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-3 text-[11px] text-slate-300/90 md:text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Гарантия совпадения с вашим авто
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-sky-400" />
              Оригиналы и проверенные аналоги
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[300px] md:mx-0 md:max-w-[440px] lg:max-w-[520px] overflow-hidden">
          <div className="absolute -inset-px rounded-3xl bg-slate-900/60 shadow-[0_0_45px_rgba(248,113,113,0.45)] backdrop-blur -z-10" />
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={0}
            slidesPerView={1}
            loop
            autoplay={{ delay: 6000, disableOnInteraction: false }}
            pagination={{
              clickable: true,
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              setActiveIndex(swiper.realIndex);
            }}
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            className="banner-swiper overflow-visible! rounded-3xl"
          >
            {SLIDES.map((slide, index) => (
              <SwiperSlide key={slide.src}>
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl md:aspect-5/4">
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    sizes="(min-width: 1024px) 520px, (min-width: 768px) 440px, 300px"
                    className="rounded-3xl object-cover object-center"
                    priority={index === 0}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          <button
            type="button"
            onClick={() => swiperRef.current?.slidePrev()}
            className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-slate-900/80 text-sm text-slate-100 shadow-md transition hover:bg-slate-800"
            aria-label="Предыдущий баннер"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => swiperRef.current?.slideNext()}
            className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-sm text-slate-100 shadow-md transition hover:bg-slate-800"
            aria-label="Следующий баннер"
          >
            ›
          </button>
          <p
            key={activeIndex}
            className="banner-caption mt-6 min-h-[2.5rem] text-center text-sm font-medium text-slate-300"
          >
            {currentCaption}
          </p>
        </div>
      </div>
    </section>
  );
}
