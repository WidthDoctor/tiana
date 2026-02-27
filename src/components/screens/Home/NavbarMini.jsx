'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {cormorantGaramond, erasLight} from '../../../app/fonts';
import styles from './NavbarMini.module.css';

const MENU_ITEMS = [
    { id: 'process', label: 'Процесс пошива', image: '/images/homeSlider/1.png' },
    { id: 'pricing', label: 'Стоимость', image: '/images/homeSlider/2.jpg' },
    { id: 'timeline', label: 'Сроки', image: '/images/homeSlider/3.jpg' },
    { id: 'deferred-start', label: 'Отложенный старт', image: '/images/homeSlider/5.jpg' },
    { id: 'packaging', label: 'Упаковка', image: '/images/homeSlider/8.jpg' },
    { id: 'design', label: 'Дизайн', image: '/images/homeSlider/18.jpg' },
    { id: 'tone-of-voice', label: 'Tone of Voice', image: '/images/homeSlider/26a.jpg' },
    { id: 'atelier', label: 'Ателье', image: '/images/homeSlider/ann(5).jpg' },
    { id: 'appointment', label: 'Запишитесь на прием', image: '/images/homeSlider/toma(5).jpg' },
    { id: 'faq', label: 'Часто задаваемые вопросы', image: '/images/homeSlider/general.png' },
];

const PRIMARY_MENU_IDS = [
    'process',
    'pricing',
    'timeline',
    'deferred-start',
    'packaging',
    'design',
    'tone-of-voice',
];

const SECONDARY_MENU_IDS = ['atelier', 'appointment', 'faq'];

const CONTENT_SWITCH_DURATION = 220;
const CONTENT_CLOSE_DURATION = 820;

export default function NavbarMini() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState(MENU_ITEMS[0].id);
    const [displayedMenuId, setDisplayedMenuId] = useState(MENU_ITEMS[0].id);
    const [isContentVisible, setIsContentVisible] = useState(false);
    const [isContentOpen, setIsContentOpen] = useState(false);
    const [isContentClosing, setIsContentClosing] = useState(false);
    const [isContentSwitching, setIsContentSwitching] = useState(false);
    const switchTimeoutRef = useRef(null);
    const closeTimeoutRef = useRef(null);
    const openFrameRef = useRef(null);

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

    useEffect(() => {
        return () => {
            if (switchTimeoutRef.current) {
                clearTimeout(switchTimeoutRef.current);
            }

            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }

            if (openFrameRef.current) {
                cancelAnimationFrame(openFrameRef.current);
            }
        };
    }, []);

    const openContent = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
        }

        if (openFrameRef.current) {
            cancelAnimationFrame(openFrameRef.current);
        }

        setIsContentVisible(true);
        setIsContentClosing(false);

        openFrameRef.current = requestAnimationFrame(() => {
            setIsContentOpen(true);
        });
    };

    const closeContentWithReverse = useCallback(() => {
        if (!isContentVisible || isContentClosing) {
            setIsOpen(false);
            return;
        }

        setIsOpen(false);
        setIsContentClosing(true);
        setIsContentOpen(false);
        setIsContentSwitching(false);

        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
        }

        closeTimeoutRef.current = setTimeout(() => {
            setIsContentVisible(false);
            setIsContentClosing(false);
        }, CONTENT_CLOSE_DURATION);
    }, [isContentClosing, isContentVisible]);

    useEffect(() => {
        const handleExternalLogoClose = () => {
            closeContentWithReverse();
        };

        window.addEventListener('tiana:logo-close-content', handleExternalLogoClose);

        return () => {
            window.removeEventListener('tiana:logo-close-content', handleExternalLogoClose);
        };
    }, [closeContentWithReverse]);

    const handleLogoClick = (event) => {
        if (isContentVisible) {
            event.preventDefault();
            closeContentWithReverse();
            return;
        }

        setIsOpen(false);
    };

    const handleMenuSelect = (menuId) => {
        setIsOpen(false);
        setActiveMenuId(menuId);

        if (!isContentVisible) {
            setDisplayedMenuId(menuId);
            setIsContentSwitching(false);
            openContent();
            return;
        }

        if (!isContentOpen) {
            openContent();
        }

        if (menuId === displayedMenuId) {
            return;
        }

        setIsContentSwitching(true);

        if (switchTimeoutRef.current) {
            clearTimeout(switchTimeoutRef.current);
        }

        switchTimeoutRef.current = setTimeout(() => {
            setDisplayedMenuId(menuId);
            setIsContentSwitching(false);
        }, CONTENT_SWITCH_DURATION);
    };

    const displayedMenu = MENU_ITEMS.find((item) => item.id === displayedMenuId) ?? MENU_ITEMS[0];
    const primaryMenuItems = MENU_ITEMS.filter((item) => PRIMARY_MENU_IDS.includes(item.id));
    const secondaryMenuItems = MENU_ITEMS.filter((item) => SECONDARY_MENU_IDS.includes(item.id));

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
                <Link href="/" className={`${styles.drawerLogo} ${erasLight.className}`} onClick={handleLogoClick}>
                    Tiana
                </Link>

                <div className={styles.section}>
                    <ul className={styles.panel}>
                        {primaryMenuItems.map((item) => (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    className={`${styles.menuItem} ${activeMenuId === item.id ? styles.menuItemActive : ''}`}
                                    onClick={() => handleMenuSelect(item.id)}
                                >
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={`${styles.section} ${styles.sectionSecondary}`}>
                    <ul className={styles.panel}>
                        {secondaryMenuItems.map((item) => (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    className={`${styles.menuItem} ${activeMenuId === item.id ? styles.menuItemActive : ''}`}
                                    onClick={() => handleMenuSelect(item.id)}
                                >
                                    {item.label}
                                </button>
                            </li>
                        ))}
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

            <section
                className={`${styles.contentStage} ${isContentVisible ? styles.contentStageVisible : ''} ${isContentOpen ? styles.contentStageOpen : ''} ${isContentClosing ? styles.contentStageClosing : ''}`}
                aria-hidden={!isContentVisible}
            >
                <div className={styles.revealLine} />

                <div className={styles.contentBox}>
                    <div className={`${styles.horizontalSelector} ${cormorantGaramond.className}`} role="tablist" aria-label="Разделы">
                        {MENU_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                role="tab"
                                aria-selected={activeMenuId === item.id}
                                className={`${styles.selectorItem} ${activeMenuId === item.id ? styles.selectorItemActive : ''}`}
                                onClick={() => handleMenuSelect(item.id)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className={`${styles.contentInner} ${isContentSwitching ? styles.contentSwitching : ''}`}>
                        <h2 className={`${styles.contentTitle} ${cormorantGaramond.className}`}>{displayedMenu.label}</h2>

                        <div className={styles.contentMedia}>
                            <Image
                                src={displayedMenu.image}
                                alt={displayedMenu.label}
                                fill
                                sizes="(max-width: 900px) calc(100vw - 120px), 60vw"
                                className={styles.contentImage}
                            />
                        </div>
                    </div>
                </div>
            </section>
        </div>

    );


}