import {cormorantGaramond} from '../../../app/fonts';
import styles from './NavigationGeneral.module.css';


export default function NavigationGeneral() {
    return(
        <nav className={`${styles.navigation} ${cormorantGaramond.className}`}>
            <ul className={styles.list}>
                <li>Портфолио</li>
                <li>Ателье</li>
                <li>Невесты</li>
                <li>Дневник</li>
            </ul>
        </nav>
    )
}