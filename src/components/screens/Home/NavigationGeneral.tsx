"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { cormorantGaramond } from "../../../app/fonts";
import styles from "./NavigationGeneral.module.css";

type NavigationGeneralProps = {
  logoClassName: string;
};

export default function NavigationGeneral({
  logoClassName,
}: NavigationGeneralProps) {
  const handleLogoClick = (): void => {
    window.dispatchEvent(new CustomEvent("tiana:logo-close-content"));
  };

  const handlePortfolioClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("tiana:open-portfolio"));
  };

  const handleJournalClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("tiana:open-journal"));
  };

  const handleAccessoriesClick = (
    event: MouseEvent<HTMLAnchorElement>,
  ): void => {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("tiana:open-accessories"));
  };

  const handleAppointmentClick = (
    event: MouseEvent<HTMLAnchorElement>,
  ): void => {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("tiana:open-appointment"));
  };

  return (
    <nav
      className={`${styles.navigation} ${cormorantGaramond.className}`}
      aria-label="Основная навигация"
    >
      <div className={styles.row}>
        <ul className={`${styles.list} ${styles.leftList}`}>
          <li>
            <Link href="/?section=portfolio" onClick={handlePortfolioClick}>
              Портфолио
            </Link>
          </li>
          <li>
            <Link href="/?section=accessories" onClick={handleAccessoriesClick}>
              Аксессуары
            </Link>
          </li>
        </ul>

        <h1 className={`${logoClassName} ${styles.logo}`}>
          <Link
            href="/"
            className={styles.logoButton}
            onClick={handleLogoClick}
          >
            Tiana
          </Link>
        </h1>

        <ul className={`${styles.list} ${styles.rightList}`}>
          <li>
            <Link href="/atelier">Ателье</Link>
          </li>
          <li>
            <Link href="/contacts">Контакты</Link>
          </li>
          <li>
            <Link href="/?section=journal" onClick={handleJournalClick}>
              Журнал
            </Link>
          </li>
          <li>
            <Link href="/?section=appointment" onClick={handleAppointmentClick}>
              Записаться на приём
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
