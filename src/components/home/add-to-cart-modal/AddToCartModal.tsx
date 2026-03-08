'use client';

import Image from 'next/image';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import { useState } from 'react';

export interface CartProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  img: string;
}

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: CartProduct | null;
}

export default function AddToCartModal({
  isOpen,
  onClose,
  product,
}: AddToCartModalProps) {
  const [qty, setQty] = useState(1);

  if (!product) return null;

  const total = product.price * qty;

  const decrease = () => setQty((q) => Math.max(1, q - 1));
  const increase = () => setQty((q) => q + 1);
  const remove = () => {
    setQty(1);
    onClose();
  };

  const handleAddToCart = () => {
    // TODO: cart logic
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      classNames={{
        base: 'rounded-2xl ',
        header: 'border-b border-gray-100 pb-3',
        footer: 'border-t border-gray-100 pt-3',
      }}
    >
      <ModalContent>
        <ModalHeader className="text-lg font-semibold text-gray-900">
          Добавить в корзину
        </ModalHeader>

        <ModalBody className="py-5">
          <div className="flex items-center gap-4">
            {/* Product image */}
            <div className="w-[100px] h-[100px] shrink-0 relative">
              <Image
                src={`/img/${product.img}`}
                alt={product.name}
                fill
                className="object-contain"
              />
            </div>

            {/* Name + description */}
            <div className="flex flex-col gap-1 min-w-0">
              <button className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 self-start mb-1 hover:border-[#E21321] transition-colors">
                <i className="fa-regular fa-heart text-sm text-gray-400" />
              </button>
              <span className="font-semibold text-gray-900 text-sm leading-tight">
                {product.name}
              </span>
              <span className="text-xs text-gray-400">
                {product.description ?? `${product.name} Масло моторное`}
              </span>
            </div>

            {/* Delivery */}
            <div className="hidden md:flex flex-col items-center flex-1 text-center">
              <span className="text-sm text-gray-400">Доставка 2 дней</span>
            </div>

            {/* Qty + price */}
            <div className="flex flex-col items-end gap-2 shrink-0 ml-auto">
              {/* Counter */}
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1">
                <button
                  onClick={decrease}
                  className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-[#E21321] transition-colors"
                >
                  <i className="fa-solid fa-minus text-xs" />
                </button>
                <span className="w-6 text-center text-sm font-medium">
                  {qty}
                </span>
                <button
                  onClick={increase}
                  className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-[#E21321] transition-colors"
                >
                  <i className="fa-solid fa-plus text-xs" />
                </button>
              </div>

              <span className="text-xs text-gray-400">
                1 шт = {product.price.toLocaleString('ru-RU')} AMD
              </span>

              <span className="text-xl font-bold text-[#E21321]">
                {total.toLocaleString('ru-RU')} AMD
              </span>
            </div>

            {/* Delete */}
            <button
              onClick={remove}
              className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:border-[#E21321] hover:text-[#E21321] transition-colors shrink-0"
            >
              <i className="fa-solid fa-trash text-sm text-gray-400" />
            </button>
          </div>
        </ModalBody>

        <ModalFooter className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="border border-[#E21321] text-gray-800 font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            Перейти в корзину
          </button>
          <button
            onClick={handleAddToCart}
            className="bg-[#E21321] text-white font-semibold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:bg-[#c41020] transition-colors"
          >
            <i className="fa-solid fa-cart-shopping" />
            Добавить в корзину
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
