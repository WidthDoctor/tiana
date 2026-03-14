"use client";

import { useMemo, useState } from "react";
import {
  type FaqDirectoryHandle,
  syncFaqToDirectory,
} from "../Faq/folderStorage";
import { loadFaqItems, saveFaqItems } from "../Faq/storage";
import type { FaqItem } from "../Faq/types";
import styles from "./FaqEditor.module.css";

type DirectoryPickerHandle = FaqDirectoryHandle & {
  getDirectoryHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<DirectoryPickerHandle>;
};

function createEmptyFaqItem(): FaqItem {
  return {
    id: `faq-${Date.now()}`,
    question: "Новый вопрос",
    answer: "Ответ",
  };
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-я0-9-\s_]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/_+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function FaqEditor() {
  const [items, setItems] = useState<FaqItem[]>(() => loadFaqItems());
  const [activeItemId, setActiveItemId] = useState<string>(
    () => loadFaqItems()[0]?.id ?? "",
  );
  const [statusText, setStatusText] = useState("Готово к редактированию.");
  const [faqDirHandle, setFaqDirHandle] =
    useState<DirectoryPickerHandle | null>(null);

  const activeItemIndex = items.findIndex((item) => item.id === activeItemId);
  const activeItem = activeItemIndex >= 0 ? items[activeItemIndex] : undefined;

  const itemCountLabel = useMemo(() => {
    if (items.length === 1) {
      return "1 вопрос";
    }

    return `${items.length} вопросов`;
  }, [items.length]);

  const updateItem = (nextItem: FaqItem) => {
    if (activeItemIndex < 0) {
      return;
    }

    setItems((previous) =>
      previous.map((item, index) =>
        index === activeItemIndex ? nextItem : item,
      ),
    );
  };

  const handleCreateItem = () => {
    const newItem = createEmptyFaqItem();
    setItems((previous) => [...previous, newItem]);
    setActiveItemId(newItem.id);
    setStatusText("Создан новый вопрос.");
  };

  const handleDeleteItem = () => {
    if (!activeItem) {
      return;
    }

    const nextItems = items.filter((item) => item.id !== activeItem.id);
    setItems(nextItems);
    setActiveItemId(nextItems[0]?.id ?? "");
    setStatusText("Вопрос удален.");
  };

  const handleMoveItem = (direction: "up" | "down") => {
    if (!activeItem || activeItemIndex < 0) {
      return;
    }

    if (direction === "up" && activeItemIndex === 0) {
      return;
    }

    if (direction === "down" && activeItemIndex === items.length - 1) {
      return;
    }

    const targetIndex =
      direction === "up" ? activeItemIndex - 1 : activeItemIndex + 1;
    const nextItems = moveItem(items, activeItemIndex, targetIndex);
    setItems(nextItems);
    setActiveItemId(activeItem.id);
    setStatusText("Порядок вопросов обновлен.");
  };

  const getOrPickFaqDirHandle = async () => {
    if (faqDirHandle) {
      return faqDirHandle;
    }

    const picker = (
      window as unknown as {
        showDirectoryPicker?: () => Promise<DirectoryPickerHandle>;
      }
    ).showDirectoryPicker;

    if (!picker) {
      return null;
    }

    const picked = await picker();
    let faqHandle: DirectoryPickerHandle;

    if (picked.name === "faq") {
      faqHandle = picked;
    } else if (picked.name === "public") {
      faqHandle = await picked.getDirectoryHandle("faq", {
        create: true,
      });
    } else {
      try {
        const publicHandle = await picked.getDirectoryHandle("public");
        faqHandle = await publicHandle.getDirectoryHandle("faq", {
          create: true,
        });
      } catch {
        faqHandle = await picked.getDirectoryHandle("faq", {
          create: true,
        });
      }
    }

    setFaqDirHandle(faqHandle);
    return faqHandle;
  };

  const handleSave = async () => {
    const normalized = items.map((item, index) => ({
      id: slugify(item.id) || `faq-${index + 1}`,
      question: item.question.trim() || `Вопрос ${index + 1}`,
      answer: item.answer.trim() || "Ответ",
    }));

    const ids = normalized.map((item) => item.id);
    const hasDuplicateIds = new Set(ids).size !== ids.length;

    if (hasDuplicateIds) {
      window.alert("есть одинаковые ID ТАК ДЕЛАТЬ КУРВА НЕЛЬЗЯ");
      setStatusText("Сохранение отменено: найдены одинаковые ID.");
      return;
    }

    saveFaqItems(normalized);
    setItems(normalized);
    setActiveItemId((current) =>
      normalized.some((item) => item.id === current)
        ? current
        : (normalized[0]?.id ?? ""),
    );

    try {
      const dirHandle = await getOrPickFaqDirHandle();

      if (!dirHandle) {
        setStatusText(
          "Сервер читает public/faq/questions.json. Выберите папку public (или public/faq) и сохраните снова.",
        );
        return;
      }

      const synced = await syncFaqToDirectory(dirHandle, normalized);
      setItems(synced);
      saveFaqItems(synced);
      setStatusText("Сохранено в public/faq/questions.json.");

      setActiveItemId((current) =>
        synced.some((item) => item.id === current)
          ? current
          : (synced[0]?.id ?? ""),
      );
    } catch {
      setStatusText("Сохранение отменено или не удалось записать FAQ.");
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.title}>Editor · FAQ</h1>
          <p className={styles.subtitle}>{itemCountLabel}</p>
        </div>

        <div className={styles.list}>
          {items.map((item, index) => (
            <button
              key={`${item.id}-${index}`}
              type="button"
              className={`${styles.postItem} ${item.id === activeItemId ? styles.postItemActive : ""}`}
              onClick={() => setActiveItemId(item.id)}
            >
              <span className={styles.postItemTitle}>{item.question}</span>
              <span className={styles.postItemId}>{item.id}</span>
            </button>
          ))}
        </div>

        <div className={styles.sidebarActions}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleCreateItem}
          >
            + Добавить вопрос
          </button>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleSave}
            disabled={!activeItem}
          >
            Сохранить
          </button>
          <button
            type="button"
            className={styles.actionButtonGhost}
            onClick={handleDeleteItem}
            disabled={!activeItem}
          >
            Удалить выбранный
          </button>
        </div>

        <p className={styles.status}>{statusText}</p>
        <p className={styles.hint}>
          Кнопка «Сохранить» обновляет localStorage и файл
          public/faq/questions.json.
        </p>
      </section>

      <section className={styles.editorArea}>
        {activeItem ? (
          <>
            <div className={styles.toolbar}>
              <button
                type="button"
                className={styles.toolbarButton}
                onClick={() => handleMoveItem("up")}
                disabled={activeItemIndex <= 0}
              >
                ↑ Выше
              </button>
              <button
                type="button"
                className={styles.toolbarButton}
                onClick={() => handleMoveItem("down")}
                disabled={
                  activeItemIndex === -1 || activeItemIndex >= items.length - 1
                }
              >
                ↓ Ниже
              </button>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>ID</span>
                <input
                  value={activeItem.id}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    setActiveItemId(nextId);
                    updateItem({
                      ...activeItem,
                      id: nextId,
                    });
                  }}
                />
              </label>

              <label className={styles.fieldFull}>
                <span>Вопрос</span>
                <input
                  value={activeItem.question}
                  onChange={(event) =>
                    updateItem({
                      ...activeItem,
                      question: event.target.value,
                    })
                  }
                />
              </label>

              <label className={styles.fieldFull}>
                <span>Ответ</span>
                <textarea
                  rows={8}
                  value={activeItem.answer}
                  onChange={(event) =>
                    updateItem({
                      ...activeItem,
                      answer: event.target.value,
                    })
                  }
                />
              </label>
            </div>
          </>
        ) : (
          <p className={styles.empty}>
            Добавьте вопрос, чтобы начать редактирование.
          </p>
        )}
      </section>
    </main>
  );
}
