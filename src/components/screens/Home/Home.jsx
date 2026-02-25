import {cormorantGaramond} from '../../../app/fonts';
import styles from './Home.module.css';
import NavbarMini from './NavbarMini';

export default function Home() {
  return (
    <main className={styles.container}>
      <section className={styles.content} aria-label="Главный экран">
        <header className={styles.header}>
        <NavbarMini />
          <p className={`${cormorantGaramond.className} ${styles.logo}`}>TIANA</p>
        </header>
      </section>
    </main>
  );
}