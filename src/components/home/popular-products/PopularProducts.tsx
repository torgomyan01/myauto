'use client';

import { useState } from 'react';
import styles from './PopularProducts.module.scss';
import AddToCartModal, {
  type CartProduct,
} from '../add-to-cart-modal/AddToCartModal';
import ProductCard from '@/components/product/product-card/ProductCard';

const products: CartProduct[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: 'Teboil Gold L 5W-30, 4л.',
  description: 'Teboil Gold 5W-30 4 л. Масло моторное',
  price: 3000,
  img: 'product-img.png',
}));

export default function PopularProducts() {
  const [favorites, setFavorites] = useState<number[]>([2, 4, 6, 8, 10]);
  const [modalProduct, setModalProduct] = useState<CartProduct | null>(null);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const openModal = (product: CartProduct) => setModalProduct(product);
  const closeModal = () => setModalProduct(null);

  return (
    <>
      <div className={styles.popularProducts}>
        <div className="wrapper">
          <h2>Популярные товары</h2>
          <div className={styles.productsItems}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                number={product.description ?? product.name}
                name={product.name}
                price={product.price}
                imageSrc={product.img}
                isFavorite={favorites.includes(product.id)}
                onToggleFavorite={toggleFavorite}
                onAddToCart={() => openModal(product)}
              />
            ))}
          </div>
        </div>
      </div>

      <AddToCartModal
        isOpen={!!modalProduct}
        onClose={closeModal}
        product={modalProduct}
      />
    </>
  );
}
