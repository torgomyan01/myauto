'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

interface CartItem {
  id: number;
  name: string;
  description: string;
  price: number;
  qty: number;
  img: string;
  checked: boolean;
}

const initialItems: CartItem[] = [
  {
    id: 1,
    name: 'Hepu P999G12SUPERPLUS',
    description: 'Фиолетовый антифриз концентрат 1,5л',
    price: 6500,
    qty: 1,
    img: 'product-img.png',
    checked: false,
  },
  {
    id: 2,
    name: 'Hepu P999G12SUPERPLUS',
    description: 'Фиолетовый антифриз концентрат 1,5л',
    price: 6000,
    qty: 2,
    img: 'product-img.png',
    checked: true,
  },
  {
    id: 3,
    name: 'Hepu P999G12SUPERPLUS',
    description: 'Фиолетовый антифриз концентрат 1,5л',
    price: 6500,
    qty: 1,
    img: 'product-img.png',
    checked: true,
  },
  {
    id: 4,
    name: 'Hepu P999G12SUPERPLUS',
    description: 'Фиолетовый антифриз концентрат 1,5л',
    price: 6500,
    qty: 1,
    img: 'product-img.png',
    checked: false,
  },
];

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>(initialItems);

  const toggle = (id: number) =>
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );

  const toggleAll = () => {
    const allChecked = items.every((item) => item.checked);
    setItems((prev) => prev.map((item) => ({ ...item, checked: !allChecked })));
  };

  const remove = (id: number) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  const clearAll = () => setItems([]);

  const changeQty = (id: number, delta: number) =>
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const allChecked = items.length > 0 && items.every((item) => item.checked);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <i className="fa-solid fa-cart-shopping text-5xl text-gray-200" />
        <p className="text-gray-400 text-lg">Корзина пуста</p>
        <Link
          href={ROUTES.HOME}
          className="mt-2 px-6 py-3 bg-[#E21321] text-white font-bold rounded-xl text-sm hover:bg-[#c41020] transition-colors"
        >
          Перейти к покупкам
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 mt-10">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 text-center">
        В корзине {items.length} товаров
      </h1>

      {/* Select all / Clear all */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={toggleAll}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
              allChecked
                ? 'bg-gray-800 border-gray-800'
                : 'border-gray-300 bg-white'
            }`}
          >
            {allChecked && (
              <i className="fa-solid fa-check text-white text-[10px]" />
            )}
          </div>
          <span className="text-sm text-gray-600">Выбрать все</span>
        </label>

        <button
          onClick={clearAll}
          className="text-sm font-semibold text-gray-800 hover:text-[#E21321] transition-colors"
        >
          Очистить все
        </button>
      </div>

      {/* Items */}
      <div className="flex flex-col divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 py-5">
            {/* Checkbox */}
            <div
              onClick={() => toggle(item.id)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                item.checked
                  ? 'bg-gray-800 border-gray-800'
                  : 'border-gray-300 bg-white'
              }`}
            >
              {item.checked && (
                <i className="fa-solid fa-check text-white text-[10px]" />
              )}
            </div>

            {/* Image */}
            <Link href={ROUTES.PRODUCT(item.id)} className="shrink-0">
              <div className="w-[120px] h-[120px] relative border border-gray-100 rounded-xl overflow-hidden">
                <Image
                  src={`/img/${item.img}`}
                  alt={item.name}
                  fill
                  className="object-contain p-2"
                />
              </div>
            </Link>

            {/* Info + qty */}
            <div className="flex flex-col gap-3 flex-1 min-w-0">
              <div>
                <Link
                  href={ROUTES.PRODUCT(item.id)}
                  className="font-semibold text-gray-900 text-sm hover:text-[#E21321] transition-colors"
                >
                  {item.name}
                </Link>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.description}
                </p>
              </div>

              {/* Qty counter */}
              <div className="flex items-center gap-0 border border-gray-200 rounded-lg w-fit overflow-hidden">
                <button
                  onClick={() => changeQty(item.id, -1)}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-[#E21321] hover:bg-gray-50 transition-colors"
                >
                  <i className="fa-solid fa-minus text-xs" />
                </button>
                <span className="w-8 text-center text-sm font-medium">
                  {item.qty}
                </span>
                <button
                  onClick={() => changeQty(item.id, 1)}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-[#E21321] hover:bg-gray-50 transition-colors"
                >
                  <i className="fa-solid fa-plus text-xs" />
                </button>
              </div>
            </div>

            {/* Price */}
            <span className="text-lg font-bold text-gray-900 shrink-0 min-w-[100px] text-right">
              {(item.price * item.qty).toLocaleString('ru-RU')}AMD
            </span>

            {/* Delete */}
            <button
              onClick={() => remove(item.id)}
              className="w-10 h-10 rounded-full bg-gray-800 hover:bg-[#E21321] flex items-center justify-center shrink-0 transition-colors"
            >
              <i className="fa-solid fa-trash text-white text-sm" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer — total + continue */}
      <div className="border-t border-gray-100 pt-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">Итого</span>
          <span className="text-xl font-bold text-[#E21321]">
            {total.toLocaleString('ru-RU')}AMD
          </span>
        </div>

        <button className="w-full h-[52px] bg-[#E21321] hover:bg-[#c41020] text-white font-bold rounded-xl text-base transition-colors">
          Продолжить
        </button>
      </div>
    </div>
  );
}
