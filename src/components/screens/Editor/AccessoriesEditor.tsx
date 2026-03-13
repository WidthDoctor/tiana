"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { AccessoryCategory, AccessoryItem } from "../Accessories/types";
import {
  type AccessoriesDirectoryHandle,
  syncAccessoryCategoriesToDirectory,
} from "../Accessories/folderStorage";
import {
  loadAccessoryCategories,
  resetAccessoryCategories,
  saveAccessoryCategories,
} from "../Accessories/storage";
import { DEFAULT_ACCESSORY_CATEGORIES } from "../Accessories/defaultAccessories";
import styles from "./AccessoriesEditor.module.css";

function createEmptyCategory(): AccessoryCategory {
  return {
    id: `category-${Date.now()}`,
    title: "Новый раздел",
    description: "Описание раздела",
    cover: "/images/homeSlider/1.png",
    items: [
      {
        id: `item-${Date.now()}`,
        title: "Новый товар",
        price: "0 BYN",
        images: [],
      },
    ],
  };
}

function createEmptyItem(): AccessoryItem {
  return {
    id: `item-${Date.now()}`,
    title: "Новая позиция",
    price: "0 BYN",
    images: [],
  };
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

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function AccessoriesEditor() {
  const [categories, setCategories] = useState<AccessoryCategory[]>(() =>
    loadAccessoryCategories(),
  );
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    () => loadAccessoryCategories()[0]?.id ?? "",
  );
  const [statusText, setStatusText] = useState("Готово к редактированию.");
  const [accessoriesDirHandle, setAccessoriesDirHandle] =
    useState<AccessoriesDirectoryHandle | null>(null);

  const activeCategoryIndex = categories.findIndex(
    (category) => category.id === activeCategoryId,
  );
  const activeCategory =
    activeCategoryIndex >= 0 ? categories[activeCategoryIndex] : undefined;

  const categoryCountLabel = useMemo(() => {
    if (categories.length === 1) {
      return "1 раздел";
    }

    return `${categories.length} разделов`;
  }, [categories.length]);

  const updateCategory = (nextCategory: AccessoryCategory) => {
    if (!activeCategory) {
      return;
    }

    setCategories((previous) =>
      previous.map((category) =>
        category.id === activeCategory.id ? nextCategory : category,
      ),
    );
  };

  const handleCreateCategory = () => {
    const newCategory = createEmptyCategory();
    setCategories((previous) => [...previous, newCategory]);
    setActiveCategoryId(newCategory.id);
    setStatusText("Создан новый раздел аксессуаров.");
  };

  const handleDeleteCategory = () => {
    if (!activeCategory) {
      return;
    }

    const nextCategories = categories.filter(
      (category) => category.id !== activeCategory.id,
    );

    setCategories(nextCategories);
    setActiveCategoryId(nextCategories[0]?.id ?? "");
    setStatusText("Раздел удален.");
  };

  const handleMoveCategory = (direction: "up" | "down") => {
    if (!activeCategory || activeCategoryIndex < 0) {
      return;
    }

    if (direction === "up" && activeCategoryIndex === 0) {
      return;
    }

    if (direction === "down" && activeCategoryIndex === categories.length - 1) {
      return;
    }

    const targetIndex =
      direction === "up" ? activeCategoryIndex - 1 : activeCategoryIndex + 1;
    const nextCategories = moveItem(
      categories,
      activeCategoryIndex,
      targetIndex,
    );
    setCategories(nextCategories);
    setActiveCategoryId(activeCategory.id);
    setStatusText("Порядок разделов обновлен.");
  };

  const handleCategoryCoverUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file || !activeCategory) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";

      if (!result) {
        return;
      }

      updateCategory({
        ...activeCategory,
        cover: result,
      });

      setStatusText("Фотография раздела загружена.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const updateItem = (itemIndex: number, nextItem: AccessoryItem) => {
    if (!activeCategory) {
      return;
    }

    updateCategory({
      ...activeCategory,
      items: activeCategory.items.map((item, index) =>
        index === itemIndex ? nextItem : item,
      ),
    });
  };

  const handleAddItem = () => {
    if (!activeCategory) {
      return;
    }

    updateCategory({
      ...activeCategory,
      items: [...activeCategory.items, createEmptyItem()],
    });

    setStatusText("Добавлена новая позиция.");
  };

  const handleDeleteItem = (itemIndex: number) => {
    if (!activeCategory) {
      return;
    }

    updateCategory({
      ...activeCategory,
      items: activeCategory.items.filter((_, index) => index !== itemIndex),
    });

    setStatusText("Позиция удалена.");
  };

  const handleItemGalleryUpload = async (
    itemIndex: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!activeCategory) {
      return;
    }

    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const fileToDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          const result = typeof reader.result === "string" ? reader.result : "";

          if (!result) {
            reject(new Error("empty result"));
            return;
          }

          resolve(result);
        };

        reader.onerror = () => reject(new Error("reader error"));
        reader.readAsDataURL(file);
      });

    try {
      const loaded = await Promise.all(files.map(fileToDataUrl));
      const currentItem = activeCategory.items[itemIndex];

      if (!currentItem) {
        return;
      }

      updateItem(itemIndex, {
        ...currentItem,
        images: [...currentItem.images, ...loaded],
      });

      setStatusText(`Добавлено изображений: ${loaded.length}.`);
    } catch {
      setStatusText("Не удалось загрузить одно или несколько изображений.");
    }

    event.target.value = "";
  };

  const handleDeleteItemImage = (itemIndex: number, imageIndex: number) => {
    if (!activeCategory) {
      return;
    }

    const currentItem = activeCategory.items[itemIndex];

    if (!currentItem) {
      return;
    }

    updateItem(itemIndex, {
      ...currentItem,
      images: currentItem.images.filter((_, index) => index !== imageIndex),
    });

    setStatusText("Изображение удалено.");
  };

  const getOrPickAccessoriesDirHandle = async () => {
    if (accessoriesDirHandle) {
      return accessoriesDirHandle;
    }

    const picker = (
      window as unknown as {
        showDirectoryPicker?: () => Promise<AccessoriesDirectoryHandle>;
      }
    ).showDirectoryPicker;

    if (!picker) {
      return null;
    }

    const picked = await picker();
    let accessoriesHandle: AccessoriesDirectoryHandle;

    if (picked.name === "accessories") {
      accessoriesHandle = picked;
    } else if (picked.name === "public") {
      accessoriesHandle = await picked.getDirectoryHandle("accessories", {
        create: true,
      });
    } else {
      try {
        const publicHandle = await picked.getDirectoryHandle("public");
        accessoriesHandle = await publicHandle.getDirectoryHandle(
          "accessories",
          {
            create: true,
          },
        );
      } catch {
        accessoriesHandle = await picked.getDirectoryHandle("accessories", {
          create: true,
        });
      }
    }

    setAccessoriesDirHandle(accessoriesHandle);
    return accessoriesHandle;
  };

  const handleSave = async () => {
    const hasInlineImages = categories.some(
      (category) =>
        category.cover.startsWith("data:image/") ||
        category.items.some((item) =>
          item.images.some((image) => image.startsWith("data:image/")),
        ),
    );

    const normalized = categories.map((category, categoryIndex) => ({
      ...category,
      id: slugify(category.id) || `category-${categoryIndex + 1}`,
      title: category.title.trim() || `Раздел ${categoryIndex + 1}`,
      description: category.description.trim() || "Описание раздела",
      items:
        category.items.length > 0
          ? category.items.map((item, itemIndex) => ({
              ...item,
              id: slugify(item.id) || `item-${itemIndex + 1}`,
              title: item.title.trim() || `Товар ${itemIndex + 1}`,
              price: item.price.trim() || "0 BYN",
              images: item.images
                .map((image) => image.trim())
                .filter((image) => Boolean(image)),
            }))
          : [
              {
                id: "item-1",
                title: "Товар 1",
                price: "0 BYN",
                images: [],
              },
            ],
    }));

    saveAccessoryCategories(normalized);
    setCategories(normalized);
    setActiveCategoryId((current) =>
      normalized.some((category) => category.id === current)
        ? current
        : (normalized[0]?.id ?? ""),
    );

    try {
      const dirHandle = await getOrPickAccessoriesDirHandle();

      if (!dirHandle) {
        setStatusText(
          hasInlineImages
            ? "Для серверного рендера выберите папку public или public/accessories — туда будут записаны все фото и разделы."
            : "Сервер читает public/accessories. Выберите папку public (или public/accessories) и сохраните снова.",
        );
        return;
      }

      const synced = await syncAccessoryCategoriesToDirectory(
        dirHandle,
        normalized,
      );

      setCategories(synced);
      saveAccessoryCategories(synced);
      setStatusText(
        "Сохранено в public/accessories: разделы, позиции и изображения обновлены.",
      );

      setActiveCategoryId((current) =>
        synced.some((category) => category.id === current)
          ? current
          : (synced[0]?.id ?? ""),
      );
    } catch {
      setStatusText(
        "Сохранение отменено или не удалось записать папки аксессуаров.",
      );
    }
  };

  const handleResetToDefault = () => {
    resetAccessoryCategories();
    setCategories(DEFAULT_ACCESSORY_CATEGORIES);
    setActiveCategoryId(DEFAULT_ACCESSORY_CATEGORIES[0]?.id ?? "");
    setStatusText("Восстановлены базовые разделы аксессуаров.");
  };

  return (
    <main className={styles.page}>
      <section className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.title}>Editor · Accessories</h1>
          <p className={styles.subtitle}>{categoryCountLabel}</p>
        </div>

        <div className={styles.list}>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`${styles.postItem} ${category.id === activeCategoryId ? styles.postItemActive : ""}`}
              onClick={() => setActiveCategoryId(category.id)}
            >
              <span className={styles.postItemTitle}>{category.title}</span>
              <span className={styles.postItemId}>{category.id}</span>
            </button>
          ))}
        </div>

        <div className={styles.sidebarActions}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleCreateCategory}
          >
            Новый раздел
          </button>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleSave}
          >
            Сохранить
          </button>
          <button
            type="button"
            className={styles.actionButtonGhost}
            onClick={handleResetToDefault}
          >
            Сбросить
          </button>
        </div>

        <p className={styles.status}>{statusText}</p>
        <p className={styles.hint}>
          Папка public/accessories:{" "}
          {accessoriesDirHandle ? "подключена" : "будет выбрана при сохранении"}
        </p>
      </section>

      <section className={styles.editorArea}>
        {activeCategory ? (
          <>
            <div className={styles.toolbar}>
              <button
                type="button"
                className={styles.toolbarButton}
                onClick={() => handleMoveCategory("up")}
                disabled={activeCategoryIndex <= 0}
              >
                ↑ Выше
              </button>
              <button
                type="button"
                className={styles.toolbarButton}
                onClick={() => handleMoveCategory("down")}
                disabled={activeCategoryIndex >= categories.length - 1}
              >
                ↓ Ниже
              </button>
              <button
                type="button"
                className={styles.toolbarDanger}
                onClick={handleDeleteCategory}
              >
                Удалить раздел
              </button>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>ID (раздел)</span>
                <input
                  value={activeCategory.id}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    setActiveCategoryId(nextId);
                    updateCategory({ ...activeCategory, id: nextId });
                  }}
                />
              </label>

              <label className={styles.field}>
                <span>Заголовок раздела</span>
                <input
                  value={activeCategory.title}
                  onChange={(event) =>
                    updateCategory({
                      ...activeCategory,
                      title: event.target.value,
                    })
                  }
                />
              </label>

              <label className={styles.fieldFull}>
                <span>Описание раздела</span>
                <textarea
                  rows={3}
                  value={activeCategory.description}
                  onChange={(event) =>
                    updateCategory({
                      ...activeCategory,
                      description: event.target.value,
                    })
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Путь к фото раздела</span>
                <input
                  value={activeCategory.cover}
                  onChange={(event) =>
                    updateCategory({
                      ...activeCategory,
                      cover: event.target.value,
                    })
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Загрузка фото раздела</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCategoryCoverUpload}
                />
              </label>
            </div>

            <div className={styles.coverPreview}>
              <Image
                src={activeCategory.cover}
                alt={activeCategory.title}
                fill
                sizes="420px"
                className={styles.coverImage}
                unoptimized={activeCategory.cover.startsWith("data:image/")}
              />
            </div>

            <div className={styles.sectionsWrap}>
              <div className={styles.sectionsHeader}>
                <h2>Позиции раздела</h2>
                <button
                  type="button"
                  className={styles.toolbarButton}
                  onClick={handleAddItem}
                >
                  Добавить позицию
                </button>
              </div>

              {activeCategory.items.map((item, itemIndex) => (
                <div
                  key={`${activeCategory.id}-item-${itemIndex}`}
                  className={styles.sectionCard}
                >
                  <div className={styles.formGrid}>
                    <label className={styles.field}>
                      <span>ID товара</span>
                      <input
                        value={item.id}
                        onChange={(event) =>
                          updateItem(itemIndex, {
                            ...item,
                            id: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Заголовок товара</span>
                      <input
                        value={item.title}
                        onChange={(event) =>
                          updateItem(itemIndex, {
                            ...item,
                            title: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Цена</span>
                      <input
                        value={item.price}
                        onChange={(event) =>
                          updateItem(itemIndex, {
                            ...item,
                            price: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className={styles.field}>
                      <span>Добавить фото товара</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) =>
                          handleItemGalleryUpload(itemIndex, event)
                        }
                      />
                    </label>
                  </div>

                  {(item.images ?? []).length > 0 ? (
                    <div className={styles.galleryList}>
                      {item.images.map((image, imageIndex) => (
                        <div
                          key={`${item.id}-${imageIndex}`}
                          className={styles.galleryItem}
                        >
                          <input
                            value={image}
                            onChange={(event) => {
                              const nextImages = [...item.images];
                              nextImages[imageIndex] = event.target.value;
                              updateItem(itemIndex, {
                                ...item,
                                images: nextImages,
                              });
                            }}
                          />
                          <button
                            type="button"
                            className={styles.toolbarDanger}
                            onClick={() =>
                              handleDeleteItemImage(itemIndex, imageIndex)
                            }
                          >
                            Удалить фото
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.galleryEmpty}>
                      У товара пока нет изображений.
                    </p>
                  )}

                  <button
                    type="button"
                    className={styles.toolbarDanger}
                    onClick={() => handleDeleteItem(itemIndex)}
                  >
                    Удалить позицию
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className={styles.empty}>
            Создайте первый раздел, чтобы начать редактирование.
          </p>
        )}
      </section>
    </main>
  );
}
