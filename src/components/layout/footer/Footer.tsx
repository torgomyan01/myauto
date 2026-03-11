import Image from 'next/image';
import Link from 'next/link';
import styles from './Footer.module.scss';
import { ROUTES } from '@/constants/routes';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="wrapper">
        <div className={styles.footerInfo}>
          <div className={styles.footerBrand}>
            <Image
              src="/img/footer-logo.png"
              alt="MyAuto"
              width={250}
              height={60}
              className={styles.footerLogo}
            />
            <p className={styles.footerTagline}>
              Онлайн каталог автозапчастей в Армении
            </p>
          </div>

          <div className={styles.footerGrid}>
            <div className={styles.footerColumn}>
              <h4 className={styles.footerTitle}>О сервисе</h4>
              <div className={styles.footerLinks}>
                <Link href="#">О компании</Link>
                <Link href={ROUTES.CONTACTS}>Контакты</Link>
              </div>
            </div>

            <div className={styles.footerColumn}>
              <h4 className={styles.footerTitle}>Помощь</h4>
              <div className={styles.footerLinks}>
                <Link href="#">Как пользоваться каталогом</Link>
                <Link href="#">Как сделать заказ</Link>
                <Link href="#">Условия и сроки доставки</Link>
                <Link href="#">Партнерям</Link>
              </div>
            </div>

            <div className={styles.footerColumn}>
              <h4 className={styles.footerTitle}>Контакты</h4>
              <div className={styles.footerContacts}>
                <Link href="tel:+37491101095" className={styles.phone}>
                  +374 91 101095
                </Link>
                <span className={styles.address}>Ереван, Армения</span>
                <span className={styles.workHours}>Каждый день 10:00–20:00</span>
              </div>
            </div>
          </div>
        </div>
        <p className={styles.copyright}>
          MyAuto.am &copy;{new Date().getFullYear()}. Все права защищены.
        </p>
      </div>
    </footer>
  );
}
