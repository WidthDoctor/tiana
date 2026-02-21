import Image from 'next/image';
import styles from './Home.module.css';
import { badScript, cormorantGaramond, zenKakuGothicNew } from '../app/fonts';

export default function Home() {
  return (
    <main className={styles.container}>
      <Image
        src="/images/general.png"
        alt=""
        fill
        className={styles.backgroundImage}
        quality={85}
        priority
        sizes="100vw"
        aria-hidden="true"
      />
      <section className={styles.content} aria-label="Главный экран">
        <header className={styles.logo}>
          <p className={cormorantGaramond.className}>TIANA</p>
        </header>
        <div className={styles.textBlock}>
          <h1 className={`${styles.mainTitle} ${zenKakuGothicNew.className}`}>
            ваше платье<br />ваш момент<br /> ваша история
          </h1>
        </div>
        <p className={`${styles.subtitle} ${zenKakuGothicNew.className}`}>
          Я создаю свадебные платья вручную,<br /> в единственном экземпляре — лично для вас.
        </p>
      </section>
    </main>
  );
}