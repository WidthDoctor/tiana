import {cormorantGaramond, erasLight} from '../../../app/fonts';
import styles from './Home.module.css';
import NavbarMini from './NavbarMini';
import NavigationGeneral from './NavigationGeneral';
import Slider from './Slider';

export default function Home() {
  return (
    <main className={styles.container}>
      <section className={styles.content} aria-label="Главный экран">
        <header className={styles.header}>
        <NavbarMini />
          <h1 className={`${erasLight.className} ${styles.logo}`}>Tiana</h1>
          <button type="button" className={`${cormorantGaramond.className} ${styles.button}`}>Записаться на приём</button>
          <NavigationGeneral />
        </header>
        <Slider />
      </section>
    </main>
  );
}