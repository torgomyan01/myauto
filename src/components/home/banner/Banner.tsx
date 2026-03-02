import styles from './Banner.module.scss';

export default function Banner() {
  return (
    <div className={styles.banner}>
      <div className="wrapper">
        <h1>
          Запчасти <span className={styles.redText}>в наличии</span>
        </h1>
      </div>
    </div>
  );
}
