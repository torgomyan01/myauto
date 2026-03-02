'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';

export interface ProductSpec {
  label: string;
  value: string;
  bold?: boolean;
}

export interface ProductData {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  deliveryLabel: string;
  images: string[];
  specs: ProductSpec[];
}

interface ProductDetailsProps {
  product: ProductData;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);

  const decrease = () => setQty((q) => Math.max(1, q - 1));
  const increase = () => setQty((q) => q + 1);
  const total = product.price * qty;

  return (
    <>
    <div className="bg-white p-6 flex gap-8 flex-col md:flex-row mt-10">
      {/* Left — images */}
      <div className="flex flex-col gap-3 shrink-0 w-full md:w-[300px]">
        {/* Main image */}
        <div className="relative w-full h-[300px] group">
          <button
            onClick={() => setIsFavorite((f) => !f)}
            className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:border-[#E21321] transition-colors"
          >
            <i
              className={
                isFavorite
                  ? 'fa-solid fa-heart text-[#E21321] text-sm'
                  : 'fa-regular fa-heart text-gray-400 text-sm'
              }
            />
          </button>

          <button
            onClick={() => setLightbox(true)}
            className="absolute inset-0 w-full h-full cursor-zoom-in"
            aria-label="Открыть изображение"
          >
            <Image
              src={`/img/${product.images[activeImg]}`}
              alt={product.name}
              fill
              className="object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </button>

          <div className="absolute bottom-2 left-2 z-10 bg-black/40 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <i className="fa-solid fa-magnifying-glass mr-1" />
            Увеличить
          </div>
        </div>

        {/* Thumbnail Swiper */}
        <div className="relative">
          <Swiper
            modules={[Navigation]}
            slidesPerView={4}
            spaceBetween={8}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            className="pb-0!"
          >
            {product.images.map((img, i) => (
              <SwiperSlide key={i}>
                <button
                  onClick={() => setActiveImg(i)}
                  className={`w-full aspect-square rounded-lg border-2 overflow-hidden transition-colors ${
                    activeImg === i
                      ? 'border-[#E21321]'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <Image
                    src={`/img/${img}`}
                    alt={`${product.name} ${i + 1}`}
                    width={56}
                    height={56}
                    className="object-contain w-full h-full"
                  />
                </button>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Prev / Next arrows */}
          {product.images.length > 4 && (
            <>
              <button
                onClick={() => swiperRef.current?.slidePrev()}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-6 h-6 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center hover:border-[#E21321] transition-colors"
              >
                <i className="fa-solid fa-chevron-left text-[10px] text-gray-500" />
              </button>
              <button
                onClick={() => swiperRef.current?.slideNext()}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-6 h-6 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center hover:border-[#E21321] transition-colors"
              >
                <i className="fa-solid fa-chevron-right text-[10px] text-gray-500" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Center — info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-1">{product.sku}</p>
        <h1 className="text-xl font-bold text-gray-900 mb-5">{product.name}</h1>

        {/* Specs table */}
        <div className="flex flex-col gap-0 w-fill max-w-[500px]">
          {product.specs.map((spec, i) => (
            <div key={i} className="flex items-center gap-2 py-2 last:border-0">
              <span className="text-sm text-gray-500 shrink-0 w-44">
                {spec.label}
              </span>
              <span className="flex-1 border-b border-dotted border-gray-300 self-end mb-1" />
              <span
                className={`text-sm shrink-0 ${spec.bold ? 'font-bold text-gray-900' : 'text-gray-700'}`}
              >
                {spec.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — buy block */}
      <div className="shrink-0 w-full md:w-[400px] flex flex-col gap-4">
        <div className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
          {/* Stock */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <i className="fa-solid fa-check text-green-500 text-xs" />
            {product.stock} шт. в наличии
          </div>

          {/* Delivery */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <i className="fa-solid fa-truck text-gray-400 text-xs" />
            {product.deliveryLabel}
          </div>

          {/* Qty counter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={decrease}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#E21321] hover:bg-gray-50 transition-colors"
              >
                <i className="fa-solid fa-minus text-xs" />
              </button>
              <span className="w-8 text-center text-sm font-medium">{qty}</span>
              <button
                onClick={increase}
                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#E21321] hover:bg-gray-50 transition-colors"
              >
                <i className="fa-solid fa-plus text-xs" />
              </button>
            </div>

            <span className="text-lg font-bold text-[#E21321] ml-auto">
              {total.toLocaleString('ru-RU')}AMD
            </span>
          </div>

          {/* Add to cart */}
          <button className="w-full h-[44px] bg-[#E21321] hover:bg-[#c41020] text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
            <i className="fa-solid fa-cart-shopping" />
            Добавить в корзину
          </button>
        </div>
      </div>
    </div>

    {/* Lightbox */}
    
    {lightbox && (
      <div
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        onClick={() => setLightbox(false)}
      >
        {/* Close */}
        <button
          onClick={() => setLightbox(false)}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <i className="fa-solid fa-xmark text-white text-lg" />
        </button>

        {/* Prev */}
        {product.images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); setActiveImg((i) => (i - 1 + product.images.length) % product.images.length); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <i className="fa-solid fa-chevron-left text-white" />
          </button>
        )}

        {/* Image */}
        <div
          className="relative w-full max-w-3xl aspect-square"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={`/img/${product.images[activeImg]}`}
            alt={product.name}
            fill
            className="object-contain"
          />
        </div>

        {/* Next */}
        {product.images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); setActiveImg((i) => (i + 1) % product.images.length); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <i className="fa-solid fa-chevron-right text-white" />
          </button>
        )}

        {/* Dots */}
        {product.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {product.images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveImg(i); }}
                className={`w-2 h-2 rounded-full transition-colors ${activeImg === i ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        )}
      </div>
    )}
    </>
  );
}
