'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {cormorantGaramond} from '../../../app/fonts';
import styles from './NavbarMini.module.css';


export default function NavbarMini() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    return (
        <div className={styles.burgerRoot}>
            <button
                type="button"
                className={styles.burgerButton}
                aria-label="Открыть меню"
                aria-expanded={isOpen}
                aria-controls="mini-menu-drawer"
                onClick={() => setIsOpen((prev) => !prev)}
            >
                <span className={styles.burgerLine} />
                <span className={styles.burgerLine} />
                <span className={styles.burgerLine} />
            </button>

            <button
                type="button"
                className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`}
                aria-label="Закрыть меню"
                onClick={() => setIsOpen(false)}
            />

            <nav
                id="mini-menu-drawer"
                className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''} ${cormorantGaramond.className}`}
                aria-label="Дополнительная навигация"
            >
                <ul className={styles.panel}>
                    <li><Link href="/process" onClick={() => setIsOpen(false)}>Процесс пошива</Link></li>
                    <li><Link href="/pricing" onClick={() => setIsOpen(false)}>Стоимость</Link></li>
                    <li><Link href="/timeline" onClick={() => setIsOpen(false)}>Сроки</Link></li>
                    <li><Link href="/deferred-start" onClick={() => setIsOpen(false)}>Отложенный старт</Link></li>
                    <li><Link href="/packaging" onClick={() => setIsOpen(false)}>Упаковка</Link></li>
                    <li><Link href="/design" onClick={() => setIsOpen(false)}>Дизайн</Link></li>
                    <li><Link href="/tone-of-voice" onClick={() => setIsOpen(false)}>Tone of Voice</Link></li>
                </ul>
            </nav>
        </div>

    );


}