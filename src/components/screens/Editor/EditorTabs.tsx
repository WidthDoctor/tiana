"use client";

import { useState } from "react";
import JournalEditor from "./JournalEditor";
import AccessoriesEditor from "./AccessoriesEditor";
import FaqEditor from "./FaqEditor";
import styles from "./EditorTabs.module.css";

type EditorTab = "journal" | "accessories" | "faq";

export default function EditorTabs() {
  const [activeTab, setActiveTab] = useState<EditorTab>("journal");

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabsBar}>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "journal" ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("journal")}
        >
          журнал
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "accessories" ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("accessories")}
        >
          акксесуары
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === "faq" ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("faq")}
        >
          вопросы
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === "journal" ? <JournalEditor /> : null}
        {activeTab === "accessories" ? <AccessoriesEditor /> : null}
        {activeTab === "faq" ? <FaqEditor /> : null}
      </div>
    </div>
  );
}
