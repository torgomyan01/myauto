'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import styles from '@/components/home/popular-products/PopularProducts.module.scss';

interface ProductCardProps {
  id: number;
  number: string;
  name: string;
  price?: number;
  imageSrc?: string;
  discountLabel?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
  onAddToCart?: (id: number) => void;
  addToCartLabel?: string;
  catalogName?: string;
  salesRating?: number;
}

export default function ProductCard({
  id,
  name,
  price,
  imageSrc = 'product-img.png',
  discountLabel = '-20%',
  isFavorite = false,
  onToggleFavorite,
  onAddToCart,
  addToCartLabel = 'Добавить в корзину',
}: ProductCardProps) {
  return (
    <div className={styles.productsItem}>
      <span className={styles.persent}>{discountLabel}</span>

      <div
        className={styles.favoriteIcon}
        onClick={() => onToggleFavorite?.(id)}
      >
        <i
          className={isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}
          style={isFavorite ? { color: '#E21321' } : {}}
        />
      </div>

      <Link href={ROUTES.PRODUCT(id)} className={styles.imgWrap}>
        <Image
          src={imageSrc.startsWith('/img/') ? imageSrc : `/img/${imageSrc}`}
          alt={name}
          width={200}
          height={200}
        />
      </Link>

      <Link href={ROUTES.PRODUCT(id)} className={styles.name} title={name}>
        {name}
      </Link>

      <span className={styles.price}>
        {typeof price === 'number'
          ? `${price.toLocaleString('ru-RU')} AMD`
          : 'Цена по запросу'}
      </span>

      <button
        onClick={() => onAddToCart?.(id)}
        className={`red-btn ${styles.addToCart}`}
      >
        <i className="fa-solid fa-cart-shopping" />
        {addToCartLabel}
      </button>
    </div>
  );
}
