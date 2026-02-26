'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {cormorantGaramond, erasLight} from '../../../app/fonts';
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
                <Link href="/" className={`${styles.drawerLogo} ${erasLight.className}`} onClick={() => setIsOpen(false)}>
                    Tiana
                </Link>

                <div className={styles.section}>
                    <ul className={styles.panel}>
                        <li><Link href="/process" onClick={() => setIsOpen(false)}>Процесс пошива</Link></li>
                        <li><Link href="/pricing" onClick={() => setIsOpen(false)}>Стоимость</Link></li>
                        <li><Link href="/timeline" onClick={() => setIsOpen(false)}>Сроки</Link></li>
                        <li><Link href="/deferred-start" onClick={() => setIsOpen(false)}>Отложенный старт</Link></li>
                        <li><Link href="/packaging" onClick={() => setIsOpen(false)}>Упаковка</Link></li>
                        <li><Link href="/design" onClick={() => setIsOpen(false)}>Дизайн</Link></li>
                        <li><Link href="/tone-of-voice" onClick={() => setIsOpen(false)}>Tone of Voice</Link></li>
                    </ul>
                </div>

                <div className={`${styles.section} ${styles.sectionSecondary}`}>
                    <ul className={styles.panel}>
                        <li><Link href="/atelier" onClick={() => setIsOpen(false)}>Ателье</Link></li>
                        <li><Link href="/appointment" onClick={() => setIsOpen(false)}>Запишитесь на прием</Link></li>
                        <li><Link href="/faq" onClick={() => setIsOpen(false)}>Часто задаваемые вопросы</Link></li>
                    </ul>

                    <div className={styles.socials}>
                        <a
                            className={styles.socialLink}
                            href="https://instagram.com"
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Instagram"
                            onClick={() => setIsOpen(false)}
                        >
                            <svg viewBox="0 0 24 24" className={styles.socialIcon} aria-hidden="true" focusable="false">
                                <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 1.8a4 4 0 0 0-4 4v8.4a4 4 0 0 0 4 4h8.4a4 4 0 0 0 4-4V7.8a4 4 0 0 0-4-4H7.8Zm8.95 1.35a1.2 1.2 0 1 1-1.2 1.2 1.2 1.2 0 0 1 1.2-1.2ZM12 7a5 5 0 1 1-5 5 5 5 0 0 1 5-5Zm0 1.8A3.2 3.2 0 1 0 15.2 12 3.2 3.2 0 0 0 12 8.8Z" />
                            </svg>
                        </a>

                        <a
                            className={styles.socialLink}
                            href="https://t.me"
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Telegram"
                            onClick={() => setIsOpen(false)}
                        >
                            <svg viewBox="0 0 24 24" className={styles.socialIcon} aria-hidden="true" focusable="false">
                                <path d="M21.27 4.67a1.75 1.75 0 0 0-1.94-.28L3.65 10.75a1.6 1.6 0 0 0 .08 3l3.72 1.2 1.4 4.45a1.55 1.55 0 0 0 2.62.63l2.24-2.2 3.74 2.74a1.85 1.85 0 0 0 2.9-1.08l2.02-12.94a1.74 1.74 0 0 0-1.1-1.88ZM9.18 14.43l7.77-6.6c.22-.19.5.12.3.33l-6.42 7.08-.25 2.42-1.4-3.23Z" />
                            </svg>
                        </a>
                    </div>
                </div>
            </nav>
        </div>

    );


}