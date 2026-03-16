"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { erasLight } from "../../../app/fonts";
import type { AccessoryCategory } from "../Accessories/types";
import type { JournalPost } from "../Journal/posts/types";
import type { PortfolioBride } from "../../../lib/portfolio";
import type { FaqItem } from "../Faq/types";
import styles from "./HomeStyles.module.css";
import NavigationGeneral from "./NavigationGeneral";
import Portfolio from "../Portfolio/portfolio";
import Journal from "../Journal/journal";
import Accessories from "../Accessories/Accessories";
import Appointment from "../Appointment/Appointment";
import Select from "../selector";

type HomeProps = {
  portfolioBrides: PortfolioBride[];
  journalPosts: JournalPost[];
  accessoryCategories: AccessoryCategory[];
  faqItems: FaqItem[];
};

export default function Home({
  portfolioBrides,
  journalPosts,
  accessoryCategories,
  faqItems,
}: HomeProps) {
  const handleHeroPortfolioClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("tiana:open-portfolio"));
  };

  const handleHeroAppointmentClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("tiana:open-appointment"));
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <Select faqItems={faqItems} />
        <NavigationGeneral logoClassName={erasLight.className} />
      </header>

      <section className={styles.content} aria-label="Главный экран">
        <section className={styles.hero} aria-label="Презентация ателье">
          <p className={styles.heroKicker}>Ателье свадебной моды</p>
          <h2 className={`${styles.heroTitle} ${erasLight.className}`}>
            Индивидуальный пошив свадебных платьев
          </h2>
          <p className={styles.heroDescription}>
            Создаем платье, которое идеально садится по фигуре и отражает ваш
            стиль: от эскиза и подбора тканей до финальной примерки.
          </p>

          <div className={styles.heroActions}>
            <Link
              href="/?section=appointment"
              className={styles.heroPrimaryAction}
              onClick={handleHeroAppointmentClick}
            >
              Записаться на прием
            </Link>
            <Link
              href="/?section=portfolio"
              className={styles.heroSecondaryAction}
              onClick={handleHeroPortfolioClick}
            >
              Смотреть портфолио
            </Link>
          </div>
        </section>
      </section>

      <Portfolio portfolioBrides={portfolioBrides} />
      <Accessories initialCategories={accessoryCategories} />
      <Journal initialPosts={journalPosts} />
      <Appointment />
    </main>
  );
}
