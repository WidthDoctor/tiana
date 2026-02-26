import {erasLight} from '../../../app/fonts';
import styles from './Home.module.css';
import NavbarMini from './NavbarMini';
import NavigationGeneral from './NavigationGeneral';

export default function Home() {
  return (
    <main className={styles.container}>
      <section className={styles.content} aria-label="Главный экран">
        <header className={styles.header}>
        <NavbarMini />
          <NavigationGeneral logoClassName={erasLight.className} />
        </header>
      </section>
    </main>
  );
}