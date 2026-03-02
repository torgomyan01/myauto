import Image from 'next/image';
import Link from 'next/link';
import styles from './Spares.module.scss';

const spares = [
  { img: 'spares-img1.png', label: 'Легковые' },
  { img: 'spares-img2.png', label: 'Грузовые' },
  { img: 'spares-img3.png', label: 'Мототехника' },
  { img: 'spares-img4.png', label: 'Масла' },
  { img: 'spares-img5.png', label: 'Аксессуары' },
];

export default function Spares() {
  return (
    <div className={styles.spares}>
      <div className="wrapper">
        <h2>Каталог запчасти</h2>
        <div className={styles.sparesItems}>
          {spares.map(item => (
            <Link href="#" key={item.label} className={styles.sparesItem}>
              <Image src={`/img/${item.img}`} alt={item.label} width={120} height={120} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
