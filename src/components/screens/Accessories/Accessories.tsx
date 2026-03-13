"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { TouchEvent } from "react";
import styles from "./Accessories.module.css";
import { DEFAULT_ACCESSORY_CATEGORIES } from "./defaultAccessories";
import { ACCESSORIES_STORAGE_KEY, loadAccessoryCategories } from "./storage";
import type { AccessoryCategory } from "./types";

type AccessoriesProps = {
  initialCategories: AccessoryCategory[];
};

function getPublicBasePath(): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
}

function normalizeImageSrc(src: string): string {
  if (!src) {
    return src;
  }

  if (
    src.startsWith("data:image/") ||
    src.startsWith("blob:") ||
    src.startsWith("http://") ||
    src.startsWith("https://")
  ) {
    return src;
  }

  const basePath = getPublicBasePath();

  if (!basePath) {
    return src;
  }

  if (src === basePath || src.startsWith(`${basePath}/`)) {
    return src;
  }

  if (src.startsWith("/")) {
    return `${basePath}${src}`;
  }

  return `${basePath}/${src.replace(/^\/+/, "")}`;
}

export default function Accessories({ initialCategories }: AccessoriesProps) {
  const searchParams = useSearchParams();
  const [isAccessoriesOpen, setIsAccessoriesOpen] = useState(false);
  const [categories, setCategories] = useState<AccessoryCategory[]>(
    initialCategories.length > 0
      ? initialCategories
      : DEFAULT_ACCESSORY_CATEGORIES,
  );
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<
    number | null
  >(null);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(
    null,
  );
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [zoomImageIndex, setZoomImageIndex] = useState(0);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [zoomSwipeOffsetX, setZoomSwipeOffsetX] = useState(0);
  const [isZoomSwipeTransitionEnabled, setIsZoomSwipeTransitionEnabled] =
    useState(false);
  const hasAccessoriesHistoryEntryRef = useRef(false);
  const hasCategoryHistoryEntryRef = useRef(false);
  const hasZoomHistoryEntryRef = useRef(false);
  const skipHistoryPushRef = useRef(false);
  const zoomTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const zoomTouchAxisRef = useRef<"x" | "y" | null>(null);
  const zoomViewportWidthRef = useRef(0);
  const zoomSnapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCategory =
    activeCategoryIndex !== null ? categories[activeCategoryIndex] : undefined;
  const safeActiveItemIndex = useMemo(() => {
    if (!activeCategory || activeItemIndex === null) {
      return null;
    }

    if (activeCategory.items.length === 0) {
      return null;
    }

    return Math.min(activeItemIndex, activeCategory.items.length - 1);
  }, [activeCategory, activeItemIndex]);
  const activeItem =
    activeCategory && safeActiveItemIndex !== null
      ? activeCategory.items[safeActiveItemIndex]
      : undefined;

  const zoomImages = useMemo(() => {
    if (!activeItem || !activeCategory) {
      return [] as string[];
    }

    const sources = (
      activeItem.images.length > 0 ? activeItem.images : [activeCategory.cover]
    )
      .map((src) => normalizeImageSrc(src))
      .filter(Boolean);

    return Array.from(new Set(sources));
  }, [activeCategory, activeItem]);

  const safeZoomImageIndex = useMemo(() => {
    if (zoomImages.length === 0) {
      return 0;
    }

    return Math.min(zoomImageIndex, zoomImages.length - 1);
  }, [zoomImageIndex, zoomImages]);
  const zoomImageSrc = zoomImages[safeZoomImageIndex] ?? null;
  const canPrevZoomImage = safeZoomImageIndex > 0;
  const canNextZoomImage = safeZoomImageIndex < zoomImages.length - 1;
  const prevZoomImageSrc = canPrevZoomImage
    ? zoomImages[safeZoomImageIndex - 1]
    : zoomImageSrc;
  const nextZoomImageSrc = canNextZoomImage
    ? zoomImages[safeZoomImageIndex + 1]
    : zoomImageSrc;

  useEffect(() => {
    const sync = () => {
      const raw = window.localStorage.getItem(ACCESSORIES_STORAGE_KEY);

      if (!raw) {
        return;
      }

      setCategories(loadAccessoryCategories());
    };

    sync();

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== "tiana:accessories-categories") {
        return;
      }

      sync();
    };

    const handleUpdated = () => {
      sync();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("tiana:accessories-updated", handleUpdated);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("tiana:accessories-updated", handleUpdated);
    };
  }, []);

  const openAccessories = useCallback(() => {
    setIsAccessoriesOpen(true);
  }, []);

  const closeAccessories = useCallback(() => {
    setIsAccessoriesOpen(false);
    setActiveCategoryIndex(null);
    setActiveItemIndex(null);
    setZoomImageIndex(0);
    setIsImageZoomOpen(false);
    hasAccessoriesHistoryEntryRef.current = false;
    hasCategoryHistoryEntryRef.current = false;
    hasZoomHistoryEntryRef.current = false;
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      openAccessories();
    };

    window.addEventListener("tiana:open-accessories", handleOpen);

    return () => {
      window.removeEventListener("tiana:open-accessories", handleOpen);
    };
  }, [openAccessories]);

  useEffect(() => {
    if (searchParams.get("section") !== "accessories") {
      return;
    }

    const frame = requestAnimationFrame(() => {
      openAccessories();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [openAccessories, searchParams]);

  useEffect(() => {
    const handleLogoClose = () => {
      closeAccessories();
    };

    const handlePortfolioOpen = () => {
      closeAccessories();
    };

    const handleJournalOpen = () => {
      closeAccessories();
    };

    window.addEventListener("tiana:logo-close-content", handleLogoClose);
    window.addEventListener("tiana:open-portfolio", handlePortfolioOpen);
    window.addEventListener("tiana:open-journal", handleJournalOpen);

    return () => {
      window.removeEventListener("tiana:logo-close-content", handleLogoClose);
      window.removeEventListener("tiana:open-portfolio", handlePortfolioOpen);
      window.removeEventListener("tiana:open-journal", handleJournalOpen);
    };
  }, [closeAccessories]);

  useEffect(() => {
    const className = "accessories-open";

    document.documentElement.classList.toggle(className, isAccessoriesOpen);
    document.body.classList.toggle(className, isAccessoriesOpen);

    return () => {
      document.documentElement.classList.remove(className);
      document.body.classList.remove(className);
    };
  }, [isAccessoriesOpen]);

  useEffect(() => {
    if (!isAccessoriesOpen) {
      hasAccessoriesHistoryEntryRef.current = false;
      return;
    }

    if (skipHistoryPushRef.current) {
      skipHistoryPushRef.current = false;
      return;
    }

    if (hasAccessoriesHistoryEntryRef.current) {
      return;
    }

    window.history.pushState(
      { tianaAccessories: true, view: "stage" },
      "",
      window.location.href,
    );

    hasAccessoriesHistoryEntryRef.current = true;
  }, [isAccessoriesOpen]);

  useEffect(() => {
    if (!isAccessoriesOpen || !activeCategory) {
      if (!activeCategory) {
        hasCategoryHistoryEntryRef.current = false;
      }
      return;
    }

    if (skipHistoryPushRef.current) {
      skipHistoryPushRef.current = false;
      return;
    }

    if (hasCategoryHistoryEntryRef.current) {
      return;
    }

    window.history.pushState(
      { tianaAccessories: true, view: "category" },
      "",
      window.location.href,
    );

    hasCategoryHistoryEntryRef.current = true;
  }, [activeCategory, isAccessoriesOpen]);

  useEffect(() => {
    if (!isAccessoriesOpen || !activeCategory || !isImageZoomOpen) {
      if (!isImageZoomOpen) {
        hasZoomHistoryEntryRef.current = false;
      }
      return;
    }

    if (skipHistoryPushRef.current) {
      skipHistoryPushRef.current = false;
      return;
    }

    if (hasZoomHistoryEntryRef.current) {
      return;
    }

    window.history.pushState(
      { tianaAccessories: true, view: "zoom" },
      "",
      window.location.href,
    );

    hasZoomHistoryEntryRef.current = true;
  }, [activeCategory, isAccessoriesOpen, isImageZoomOpen]);

  useEffect(() => {
    const handlePopState = () => {
      if (!isAccessoriesOpen) {
        return;
      }

      skipHistoryPushRef.current = true;

      if (isImageZoomOpen) {
        setIsImageZoomOpen(false);
        setZoomImageIndex(0);
        hasZoomHistoryEntryRef.current = false;

        requestAnimationFrame(() => {
          skipHistoryPushRef.current = false;
        });
        return;
      }

      if (activeCategory) {
        setSelectedCategoryIndex(activeCategoryIndex);
        setActiveCategoryIndex(null);
        setActiveItemIndex(null);
        setIsImageZoomOpen(false);
        setZoomImageIndex(0);
        hasCategoryHistoryEntryRef.current = false;
        hasZoomHistoryEntryRef.current = false;

        requestAnimationFrame(() => {
          skipHistoryPushRef.current = false;
        });
        return;
      }

      closeAccessories();

      requestAnimationFrame(() => {
        skipHistoryPushRef.current = false;
      });
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [
    activeCategory,
    activeCategoryIndex,
    closeAccessories,
    isAccessoriesOpen,
    isImageZoomOpen,
  ]);

  const handleOpenCategory = (categoryIndex: number) => {
    setSelectedCategoryIndex(categoryIndex);
    setActiveCategoryIndex(categoryIndex);
    setActiveItemIndex(null);
    setIsImageZoomOpen(false);
    setZoomImageIndex(0);
    setZoomSwipeOffsetX(0);
    setIsZoomSwipeTransitionEnabled(false);
  };

  const handleBackToCategories = () => {
    setSelectedCategoryIndex(activeCategoryIndex);
    setActiveCategoryIndex(null);
    setActiveItemIndex(null);
    setIsImageZoomOpen(false);
    setZoomImageIndex(0);
    setZoomSwipeOffsetX(0);
    setIsZoomSwipeTransitionEnabled(false);
  };

  const handleOpenItem = (itemIndex: number) => {
    setActiveItemIndex(itemIndex);
    setZoomImageIndex(0);
    setIsImageZoomOpen(true);
    setZoomSwipeOffsetX(0);
    setIsZoomSwipeTransitionEnabled(false);
  };

  const handleOpenImageZoom = (imageIndex: number) => {
    setZoomImageIndex(imageIndex);
    setIsImageZoomOpen(true);
    setZoomSwipeOffsetX(0);
    setIsZoomSwipeTransitionEnabled(false);
  };

  const handleCloseImageZoom = () => {
    setIsImageZoomOpen(false);
    setZoomImageIndex(0);
    setZoomSwipeOffsetX(0);
    setIsZoomSwipeTransitionEnabled(false);
  };

  const handlePrevZoomImage = () => {
    if (!canPrevZoomImage) {
      return;
    }

    setZoomImageIndex((previous) => Math.max(previous - 1, 0));
    setZoomSwipeOffsetX(0);
    setIsZoomSwipeTransitionEnabled(false);
  };

  const handleNextZoomImage = () => {
    if (!canNextZoomImage) {
      return;
    }

    setZoomImageIndex((previous) =>
      Math.min(previous + 1, zoomImages.length - 1),
    );
    setZoomSwipeOffsetX(0);
    setIsZoomSwipeTransitionEnabled(false);
  };

  const handleZoomTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    if (zoomSnapTimeoutRef.current) {
      clearTimeout(zoomSnapTimeoutRef.current);
    }

    zoomTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
    zoomTouchAxisRef.current = null;
    zoomViewportWidthRef.current = event.currentTarget.clientWidth;
    setIsZoomSwipeTransitionEnabled(false);
  };

  const handleZoomTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    const start = zoomTouchStartRef.current;

    if (!touch || !start) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (
      !zoomTouchAxisRef.current &&
      (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)
    ) {
      zoomTouchAxisRef.current =
        Math.abs(deltaX) >= Math.abs(deltaY) ? "x" : "y";
    }

    if (zoomTouchAxisRef.current !== "x") {
      return;
    }

    const width = Math.max(zoomViewportWidthRef.current, 1);
    let adjustedDeltaX = deltaX;

    if (!canPrevZoomImage && adjustedDeltaX > 0) {
      adjustedDeltaX *= 0.18;
    }

    if (!canNextZoomImage && adjustedDeltaX < 0) {
      adjustedDeltaX *= 0.18;
    }

    const clampedDeltaX = Math.max(Math.min(adjustedDeltaX, width), -width);
    setZoomSwipeOffsetX(clampedDeltaX);
  };

  const handleZoomTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    const start = zoomTouchStartRef.current;

    if (!touch || !start) {
      return;
    }

    const deltaX = touch.clientX - start.x;

    if (zoomTouchAxisRef.current === "x") {
      const width = Math.max(zoomViewportWidthRef.current, 1);
      const threshold = width * 0.2;
      setIsZoomSwipeTransitionEnabled(true);

      if (Math.abs(deltaX) > threshold) {
        const isNextImage = deltaX < 0;
        const canNavigate = isNextImage ? canNextZoomImage : canPrevZoomImage;

        if (canNavigate) {
          setZoomSwipeOffsetX(isNextImage ? -width : width);

          zoomSnapTimeoutRef.current = setTimeout(() => {
            setZoomImageIndex((previous) =>
              isNextImage
                ? Math.min(previous + 1, zoomImages.length - 1)
                : Math.max(previous - 1, 0),
            );
            setIsZoomSwipeTransitionEnabled(false);
            setZoomSwipeOffsetX(0);
          }, 180);

          zoomTouchStartRef.current = null;
          zoomTouchAxisRef.current = null;
          return;
        }
      }

      setZoomSwipeOffsetX(0);
    }

    zoomTouchStartRef.current = null;
    zoomTouchAxisRef.current = null;
  };

  useEffect(() => {
    if (!isImageZoomOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsImageZoomOpen(false);
        setZoomImageIndex(0);
        return;
      }

      if (event.key === "ArrowLeft") {
        setZoomImageIndex((previous) => Math.max(previous - 1, 0));
      }

      if (event.key === "ArrowRight") {
        setZoomImageIndex((previous) =>
          Math.min(previous + 1, zoomImages.length - 1),
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isImageZoomOpen, zoomImages.length]);

  useEffect(() => {
    return () => {
      if (zoomSnapTimeoutRef.current) {
        clearTimeout(zoomSnapTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <section
        className={`${styles.accessoriesStage} ${isAccessoriesOpen ? styles.accessoriesStageVisible : ""}`}
        aria-label="Аксессуары"
        aria-hidden={!isAccessoriesOpen}
      >
        <div className={styles.accessoriesIntro}>
          <p className={styles.accessoriesKicker}>Аксессуары</p>
          <h2 className={styles.accessoriesTitle}>Подборка по категориям</h2>
        </div>

        <div className={styles.accessoriesGrid}>
          {categories.map((category, categoryIndex) => (
            <article key={category.id} className={styles.accessoryCategoryCard}>
              <button
                type="button"
                className={`${styles.accessoryCategoryButton} ${selectedCategoryIndex === categoryIndex || activeCategoryIndex === categoryIndex ? styles.accessoryCategoryButtonActive : ""}`}
                onClick={() => handleOpenCategory(categoryIndex)}
                aria-label={`Открыть категорию: ${category.title}`}
              >
                <div className={styles.accessoryMedia}>
                  <Image
                    src={normalizeImageSrc(category.cover)}
                    alt={category.title}
                    fill
                    sizes="(max-width: 900px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={styles.accessoryImage}
                  />
                </div>
                <h3 className={styles.accessoryTitle}>{category.title}</h3>
                <p className={styles.accessoryText}>{category.description}</p>
              </button>
            </article>
          ))}
        </div>
      </section>

      <section
        className={`${styles.categoryOverlay} ${activeCategory ? styles.categoryOverlayVisible : ""}`}
        aria-hidden={!activeCategory}
      >
        <button
          type="button"
          className={styles.categoryBackdrop}
          onClick={handleBackToCategories}
          aria-label="Вернуться к категориям"
        />

        {activeCategory ? (
          <div className={styles.categoryPanel} role="dialog" aria-modal="true">
            <div className={styles.categoryHeader}>
              <button
                type="button"
                className={styles.backButton}
                onClick={handleBackToCategories}
              >
                ← К категориям
              </button>
              <h3 className={styles.categoryTitle}>{activeCategory.title}</h3>
              <p className={styles.categoryDescription}>
                {activeCategory.description}
              </p>
            </div>

            <div className={styles.productGrid}>
              {activeCategory.items.map((item, itemIndex) => {
                const cover = normalizeImageSrc(
                  item.images[0] ?? activeCategory.cover,
                );

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.productCard} ${itemIndex === safeActiveItemIndex ? styles.productCardActive : ""}`}
                    onClick={() => handleOpenItem(itemIndex)}
                    aria-label={`Открыть товар: ${item.title}`}
                  >
                    <div className={styles.productMedia}>
                      <Image
                        src={cover}
                        alt={item.title}
                        fill
                        sizes="(max-width: 900px) 100vw, 320px"
                        className={styles.productImage}
                      />
                    </div>
                    <div className={styles.productMeta}>
                      <p className={styles.productTitle}>{item.title}</p>
                      <p className={styles.productPrice}>{item.price}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      <section
        className={`${styles.imageZoomOverlay} ${isImageZoomOpen ? styles.imageZoomOverlayVisible : ""}`}
        aria-hidden={!isImageZoomOpen}
      >
        <button
          type="button"
          className={styles.imageZoomBackdrop}
          onClick={handleCloseImageZoom}
          aria-label="Закрыть просмотр изображений"
        />

        {activeItem && zoomImageSrc ? (
          <div className={styles.imageZoomPanel}>
            <button
              type="button"
              className={`${styles.imageZoomArrow} ${styles.imageZoomArrowLeft}`}
              onClick={handlePrevZoomImage}
              aria-label="Предыдущее изображение"
              disabled={!canPrevZoomImage}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14.7 5.3a1 1 0 0 1 0 1.4L9.4 12l5.3 5.3a1 1 0 0 1-1.4 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.4 0Z" />
              </svg>
            </button>

            <button
              type="button"
              className={`${styles.imageZoomArrow} ${styles.imageZoomArrowRight}`}
              onClick={handleNextZoomImage}
              aria-label="Следующее изображение"
              disabled={!canNextZoomImage}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9.3 5.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4-1.4l5.3-5.3-5.3-5.3a1 1 0 0 1 0-1.4Z" />
              </svg>
            </button>

            <button
              type="button"
              className={styles.imageZoomClose}
              onClick={handleCloseImageZoom}
              aria-label="Закрыть"
            >
              <svg
                viewBox="0 0 24 24"
                className={styles.icon}
                aria-hidden="true"
              >
                <path d="M6.7 5.3a1 1 0 0 1 1.4 0L12 9.2l3.9-3.9a1 1 0 1 1 1.4 1.4L13.4 10.6l3.9 3.9a1 1 0 1 1-1.4 1.4L12 12l-3.9 3.9a1 1 0 1 1-1.4-1.4l3.9-3.9-3.9-3.9a1 1 0 0 1 0-1.4Z" />
              </svg>
            </button>

            <div
              className={styles.imageZoomMedia}
              onTouchStart={handleZoomTouchStart}
              onTouchMove={handleZoomTouchMove}
              onTouchEnd={handleZoomTouchEnd}
            >
              <div
                className={styles.imageZoomTrack}
                style={{
                  transform: `translateX(calc(-33.333333% + ${zoomSwipeOffsetX}px))`,
                  transition: isZoomSwipeTransitionEnabled
                    ? "transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1)"
                    : "none",
                }}
              >
                <div className={styles.imageZoomSlide}>
                  <Image
                    src={prevZoomImageSrc ?? zoomImageSrc}
                    alt="Предыдущее изображение"
                    fill
                    sizes="(max-width: 900px) 100vw, 72vw"
                    className={styles.imageZoomImage}
                  />
                </div>

                <div className={styles.imageZoomSlide}>
                  <Image
                    src={zoomImageSrc}
                    alt={`${activeItem.title} — фото ${safeZoomImageIndex + 1}`}
                    fill
                    sizes="(max-width: 900px) 100vw, 72vw"
                    className={styles.imageZoomImage}
                  />
                </div>

                <div className={styles.imageZoomSlide}>
                  <Image
                    src={nextZoomImageSrc ?? zoomImageSrc}
                    alt="Следующее изображение"
                    fill
                    sizes="(max-width: 900px) 100vw, 72vw"
                    className={styles.imageZoomImage}
                  />
                </div>
              </div>

              <div className={styles.imageZoomMobileHints} aria-hidden="true">
                <span
                  className={`${styles.imageZoomHint} ${styles.imageZoomHintLeft}`}
                >
                  <span className={styles.imageZoomHintChevron} />
                  <span className={styles.imageZoomHintChevron} />
                </span>
                <span
                  className={`${styles.imageZoomHint} ${styles.imageZoomHintRight}`}
                >
                  <span className={styles.imageZoomHintChevron} />
                  <span className={styles.imageZoomHintChevron} />
                </span>
              </div>
            </div>

            <div className={styles.imageZoomFooter}>
              <p className={styles.imageZoomTitle}>{activeItem.title}</p>
              <p className={styles.imageZoomCounter}>
                {safeZoomImageIndex + 1} / {zoomImages.length}
              </p>
            </div>

            <div className={styles.imageZoomThumbs}>
              {zoomImages.map((image, imageIndex) => (
                <button
                  key={`${activeItem.id}-thumb-${imageIndex}`}
                  type="button"
                  className={`${styles.imageZoomThumb} ${safeZoomImageIndex === imageIndex ? styles.imageZoomThumbActive : ""}`}
                  onClick={() => handleOpenImageZoom(imageIndex)}
                  aria-label={`Открыть фото ${imageIndex + 1}`}
                >
                  <Image
                    src={image}
                    alt={`${activeItem.title} — миниатюра ${imageIndex + 1}`}
                    fill
                    sizes="72px"
                    className={styles.imageZoomThumbImage}
                  />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
