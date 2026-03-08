import Image from 'next/image';
import Link from 'next/link';
import styles from './Footer.module.scss';
import { ROUTES } from '@/constants/routes';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="wrapper">
        <div className={styles.footerInfo}>
          <Image
            src="/img/footer-logo.png"
            alt="MyAuto"
            width={250}
            height={60}
            className={styles.footerLogo}
          />
          <div className={styles.footerLinks}>
            <Link href="#">О компании</Link>
            <Link href={ROUTES.CONTACTS}>Контакты</Link>
          </div>
          <div className={styles.footerLinks}>
            <Link href="#">Как пользоваться каталогом</Link>
            <Link href="#">Как сделать заказ</Link>
            <Link href="#">Условия и сроки доставки</Link>
            <Link href="#">Партнерам</Link>
          </div>
          <div className={styles.footerContacts}>
            <Link href="tel:+37411330222" className={styles.phone}>
              +374 11-330-222
            </Link>
            <span className={styles.address}>г. Ереван, 0019, Айгедзор 5</span>
          </div>
        </div>
        <p className={styles.copyright}>
          MyAuto.am &copy;{new Date().getFullYear()}. Все права защищены.
        </p>
      </div>
    </footer>
  );
}
