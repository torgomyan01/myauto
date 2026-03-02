import Image from 'next/image';
import Link from 'next/link';
import styles from './PopularBrands.module.scss';

const brands = Array.from({ length: 24 }, (_, i) => `brands-img${i + 1}.png`);

export default function PopularBrands() {
  return (
    <div className={styles.popularBrands}>
      <div className="wrapper">
        <h2>Популярные марки</h2>
        <div className={styles.brandsItems}>
          {brands.map((img, i) => (
            <Link href="#" key={i} className={styles.brandsItem}>
              <Image src={`/img/${img}`} alt={`Brand ${i + 1}`} width={80} height={80} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
