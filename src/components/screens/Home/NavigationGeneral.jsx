import Link from 'next/link';
import {cormorantGaramond} from '../../../app/fonts';
import styles from './NavigationGeneral.module.css';


export default function NavigationGeneral() {
    return(
        <nav className={`${styles.navigation} ${cormorantGaramond.className}`} aria-label="Основная навигация">
            <ul className={styles.list}>
                <li><Link href="/portfolio">Портфолио</Link></li>
                <li><Link href="/accessories">Аксессуары</Link></li>
                <li><Link href="/atelier">Ателье</Link></li>
                <li><Link href="/contacts">Контакты</Link></li>
                <li><Link href="/journal">Журнал</Link></li>
            </ul>
        </nav>
    )
}