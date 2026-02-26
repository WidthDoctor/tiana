import Link from 'next/link';
import {cormorantGaramond} from '../../../app/fonts';
import styles from './NavigationGeneral.module.css';


export default function NavigationGeneral({ logoClassName }) {
    return(
        <nav className={`${styles.navigation} ${cormorantGaramond.className}`} aria-label="Основная навигация">
            <div className={styles.row}>
                <ul className={`${styles.list} ${styles.leftList}`}>
                    <li><Link href="/portfolio">Портфолио</Link></li>
                    <li><Link href="/accessories">Аксессуары</Link></li>
                </ul>

                <h1 className={`${logoClassName} ${styles.logo}`}>Tiana</h1>

                <ul className={`${styles.list} ${styles.rightList}`}>
                    <li><Link href="/atelier">Ателье</Link></li>
                    <li><Link href="/contacts">Контакты</Link></li>
                    <li><Link href="/journal">Журнал</Link></li>
                    <li><Link href="/appointment">Записаться на приём</Link></li>
                </ul>
            </div>
        </nav>
    )
}