import {cormorantGaramond} from '../app/fonts';
import styles from './Home.module.css';
import NavbarMini from './NavbarMini';

export default function Home() {
  return (
    <main className={styles.container}>
      <section className={styles.content} aria-label="Главный экран">
        <NavbarMini />
        <header className={styles.logo}>
          <p className={cormorantGaramond.className}>TIANA</p>
        </header>
      </section>
    </main>
  );
}