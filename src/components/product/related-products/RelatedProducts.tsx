'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import styles from '../../home/popular-products/PopularProducts.module.scss';
import AddToCartModal, { type CartProduct } from '../../home/add-to-cart-modal/AddToCartModal';

const mockRelated: CartProduct[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 100,
  name: 'Teboil Gold L 5W-30, 4л.',
  description: 'Teboil Gold 5W-30 4 л. Масло моторное',
  price: 3000,
  img: 'product-img.png',
}));

export default function RelatedProducts() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [modalProduct, setModalProduct] = useState<CartProduct | null>(null);

  const toggleFavorite = (id: number) =>
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );

  return (
    <>
      <div className={styles.popularProducts}>
        <h2>Похожие товары</h2>
        <div className={styles.productsItems}>
          {mockRelated.map((product) => (
            <div className={styles.productsItem} key={product.id}>
              <span className={styles.persent}>-20%</span>

              <div
                className={styles.favoriteIcon}
                onClick={() => toggleFavorite(product.id)}
              >
                <i
                  className={
                    favorites.includes(product.id)
                      ? 'fa-solid fa-heart'
                      : 'fa-regular fa-heart'
                  }
                  style={
                    favorites.includes(product.id) ? { color: '#E21321' } : {}
                  }
                />
              </div>

              <Link href={ROUTES.PRODUCT(product.id)} className={styles.imgWrap}>
                <Image
                  src={`/img/${product.img}`}
                  alt={product.name}
                  width={200}
                  height={200}
                />
              </Link>

              <Link href={ROUTES.PRODUCT(product.id)} className={styles.name}>
                {product.name}
              </Link>

              <span className={styles.price}>
                {product.price.toLocaleString('ru-RU')} AMD
              </span>

              <button
                onClick={() => setModalProduct(product)}
                className={`red-btn ${styles.addToCart}`}
              >
                <i className="fa-solid fa-cart-shopping" />
                Добавить в корзину
              </button>
            </div>
          ))}
        </div>
      </div>

      <AddToCartModal
        isOpen={!!modalProduct}
        onClose={() => setModalProduct(null)}
        product={modalProduct}
      />
    </>
  );
}
