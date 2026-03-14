"use client";

import { useEffect, useRef, useState } from "react";
import { erasLight } from "../../../app/fonts";
import { DEFAULT_FAQ_ITEMS } from "./defaultFaq";
import { FAQ_STORAGE_KEY, loadFaqItems } from "./storage";
import type { FaqItem } from "./types";
import styles from "./Faq.module.css";

type FaqProps = {
  initialItems: FaqItem[];
  embedded?: boolean;
};

export default function Faq({ initialItems, embedded = false }: FaqProps) {
  const [items, setItems] = useState<FaqItem[]>(
    initialItems.length > 0 ? initialItems : DEFAULT_FAQ_ITEMS,
  );
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const syncItems = () => {
      const raw = window.localStorage.getItem(FAQ_STORAGE_KEY);

      if (!raw) {
        return;
      }

      setItems(loadFaqItems());
    };

    syncItems();

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== FAQ_STORAGE_KEY) {
        return;
      }

      syncItems();
    };

    const handleUpdated = () => {
      syncItems();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("tiana:faq-updated", handleUpdated);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("tiana:faq-updated", handleUpdated);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!sectionRef.current) {
        return;
      }

      if (!sectionRef.current.contains(event.target as Node)) {
        setOpenItemId(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <section
      className={`${styles.section} ${embedded ? styles.sectionEmbedded : ""}`}
      aria-label="Часто задаваемые вопросы"
      ref={sectionRef}
    >
      <h2
        className={`${styles.title} ${erasLight.className} ${embedded ? styles.titleEmbedded : ""}`}
      >
        Часто задаваемые вопросы
      </h2>

      <div className={styles.list}>
        {items.map((item) => {
          const isOpen = openItemId === item.id;

          return (
            <article
              key={item.id}
              className={`${styles.item} ${isOpen ? styles.itemOpen : ""}`}
            >
              <button
                type="button"
                className={styles.trigger}
                onClick={() => setOpenItemId(isOpen ? null : item.id)}
                aria-expanded={isOpen}
              >
                <span className={styles.triggerText}>{item.question}</span>
                <span
                  className={`${styles.marker} ${isOpen ? styles.markerOpen : ""}`}
                  aria-hidden="true"
                />
              </button>

              <div
                className={`${styles.answerWrap} ${isOpen ? styles.answerWrapOpen : ""}`}
                aria-hidden={!isOpen}
              >
                <p className={styles.answer}>{item.answer}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
