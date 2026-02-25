import {cormorantGaramond} from '../app/fonts';
import styles from './NavbarMini.module.css';


export default function NavbarMini() {
    return (
        <div className={styles.panelWrapper}>
            <div className={`${styles.panelContainer} ${cormorantGaramond.className}`}>
                <ul className={styles.panel}>
                    <li>Процесс</li>
                    <li>Стоимость</li>
                    <li>Как заказать</li>
                    <li>Уход и упаковка</li>
                </ul>
            </div>
        </div>

    );


}