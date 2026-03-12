import Link from "next/link";
import type { MouseEvent } from "react";
import type { MenuContentItem } from "./menuContentConfig";
import styles from "../Home/NavbarMini.module.css";

const MOBILE_MAIN_NAV_LINKS = [
  { href: "/?section=portfolio", label: "Портфолио", isPortfolio: true },
  { href: "/accessories", label: "Аксессуары" },
  { href: "/atelier", label: "Ателье" },
  { href: "/contacts", label: "Контакты" },
  { href: "/?section=journal", label: "Журнал", isJournal: true },
  { href: "/appointment", label: "Записаться на приём" },
] as const;

type SelectMobileProps = {
  primaryMenuItems: MenuContentItem[];
  secondaryMenuItems: MenuContentItem[];
  activeMenuId: string;
  buildMenuHref: (menuId: MenuContentItem["id"]) => string;
  onMenuSelect: (menuId: MenuContentItem["id"]) => void;
  onPortfolioOpen: () => void;
  onJournalOpen: () => void;
  onCloseDrawer: () => void;
};

const MOBILE_DUPLICATE_SECONDARY_IDS = new Set(["atelier", "appointment"]);

export default function SelectMobile({
  primaryMenuItems,
  secondaryMenuItems,
  activeMenuId,
  buildMenuHref,
  onMenuSelect,
  onPortfolioOpen,
  onJournalOpen,
  onCloseDrawer,
}: SelectMobileProps) {
  const handleMainNavClick = (
    event: MouseEvent<HTMLAnchorElement>,
    isPortfolio?: boolean,
    isJournal?: boolean,
  ) => {
    onCloseDrawer();

    if (isPortfolio) {
      event.preventDefault();
      onPortfolioOpen();
      return;
    }

    if (isJournal) {
      event.preventDefault();
      onJournalOpen();
    }
  };

  return (
    <>
      <div className={`${styles.section} ${styles.mobileMainSection}`}>
        <ul className={`${styles.panel} ${styles.mobileMainPanel}`}>
          {MOBILE_MAIN_NAV_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={styles.mobileMainItem}
                onClick={(event) =>
                  handleMainNavClick(
                    event,
                    "isPortfolio" in item ? item.isPortfolio : undefined,
                    "isJournal" in item ? item.isJournal : undefined,
                  )
                }
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.section}>
        <ul className={styles.panel}>
          {primaryMenuItems.map((item) => (
            <li key={item.id}>
              <Link
                href={buildMenuHref(item.id)}
                className={`${styles.menuItem} ${activeMenuId === item.id ? styles.menuItemActive : ""}`}
                title={item.label}
                onClick={(event) => {
                  event.preventDefault();
                  onMenuSelect(item.id);
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className={`${styles.section} ${styles.sectionSecondary}`}>
        <ul className={styles.panel}>
          {secondaryMenuItems.map((item) => (
            <li
              key={item.id}
              className={
                MOBILE_DUPLICATE_SECONDARY_IDS.has(item.id)
                  ? styles.mobileDuplicateItem
                  : ""
              }
            >
              <Link
                href={buildMenuHref(item.id)}
                className={`${styles.menuItem} ${activeMenuId === item.id ? styles.menuItemActive : ""}`}
                title={item.label}
                onClick={(event) => {
                  event.preventDefault();
                  onMenuSelect(item.id);
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.socials}>
          <a
            className={styles.socialLink}
            href="https://www.instagram.com/tiana.by?igsh=ZHF4M2lxMGp4Yjh5"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            onClick={onCloseDrawer}
          >
            <svg
              viewBox="0 0 24 24"
              className={styles.socialIcon}
              aria-hidden="true"
              focusable="false"
            >
              <path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 1.8a4 4 0 0 0-4 4v8.4a4 4 0 0 0 4 4h8.4a4 4 0 0 0 4-4V7.8a4 4 0 0 0-4-4H7.8Zm8.95 1.35a1.2 1.2 0 1 1-1.2 1.2 1.2 1.2 0 0 1 1.2-1.2ZM12 7a5 5 0 1 1-5 5 5 5 0 0 1 5-5Zm0 1.8A3.2 3.2 0 1 0 15.2 12 3.2 3.2 0 0 0 12 8.8Z" />
            </svg>
          </a>

          <a
            className={styles.socialLink}
            href="https://t.me"
            target="_blank"
            rel="noreferrer"
            aria-label="Telegram"
            onClick={onCloseDrawer}
          >
            <svg
              viewBox="0 0 24 24"
              className={styles.socialIcon}
              aria-hidden="true"
              focusable="false"
            >
              <path d="M21.27 4.67a1.75 1.75 0 0 0-1.94-.28L3.65 10.75a1.6 1.6 0 0 0 .08 3l3.72 1.2 1.4 4.45a1.55 1.55 0 0 0 2.62.63l2.24-2.2 3.74 2.74a1.85 1.85 0 0 0 2.9-1.08l2.02-12.94a1.74 1.74 0 0 0-1.1-1.88ZM9.18 14.43l7.77-6.6c.22-.19.5.12.3.33l-6.42 7.08-.25 2.42-1.4-3.23Z" />
            </svg>
          </a>
        </div>
      </div>
    </>
  );
}
