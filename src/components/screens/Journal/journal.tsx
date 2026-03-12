"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, TouchEvent } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./Journal.module.css";
import { DEFAULT_JOURNAL_POSTS } from "./posts/defaultPosts";
import { loadPostsFromPublicFolders } from "./posts/folderStorage";
import { loadJournalPosts } from "./posts/storage";
import type { JournalPost } from "./posts/types";

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

export default function Journal() {
  const searchParams = useSearchParams();
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [posts, setPosts] = useState<JournalPost[]>(DEFAULT_JOURNAL_POSTS);
  const [activePostIndex, setActivePostIndex] = useState<number | null>(null);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [zoomImageIndex, setZoomImageIndex] = useState(0);
  const hasJournalHistoryEntryRef = useRef(false);
  const hasArticleHistoryEntryRef = useRef(false);
  const hasZoomHistoryEntryRef = useRef(false);
  const skipHistoryPushRef = useRef(false);
  const zoomTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const zoomTouchAxisRef = useRef<"x" | "y" | null>(null);
  const zoomViewportWidthRef = useRef(0);
  const zoomSnapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [zoomSwipeOffsetX, setZoomSwipeOffsetX] = useState(0);
  const [isZoomSwipeTransitionEnabled, setIsZoomSwipeTransitionEnabled] =
    useState(false);

  const isMobileViewport = useCallback(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(max-width: 900px)").matches;
  }, []);
  useEffect(() => {
    const syncPosts = () => {
      setPosts(loadJournalPosts());
    };

    syncPosts();

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== "tiana:journal-posts") {
        return;
      }

      syncPosts();
    };

    const handleUpdated = () => {
      syncPosts();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("tiana:journal-posts-updated", handleUpdated);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("tiana:journal-posts-updated", handleUpdated);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadFromFolders = async () => {
      try {
        const folderPosts = await loadPostsFromPublicFolders();

        if (!isMounted) {
          return;
        }

        if (folderPosts.length > 0) {
          setPosts(folderPosts);
          return;
        }
      } catch {
        // fallback to local storage/defaults below
      }

      if (isMounted) {
        setPosts(loadJournalPosts());
      }
    };

    loadFromFolders();

    return () => {
      isMounted = false;
    };
  }, []);

  const openJournal = useCallback(() => {
    setIsJournalOpen(true);
  }, []);

  const closeJournal = useCallback(() => {
    setIsJournalOpen(false);
    setActivePostIndex(null);
    setIsImageZoomOpen(false);
    setZoomImageIndex(0);
    setZoomSwipeOffsetX(0);
    setIsZoomSwipeTransitionEnabled(false);
    hasJournalHistoryEntryRef.current = false;
    hasArticleHistoryEntryRef.current = false;
    hasZoomHistoryEntryRef.current = false;
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      openJournal();
    };

    window.addEventListener("tiana:open-journal", handleOpen);

    return () => {
      window.removeEventListener("tiana:open-journal", handleOpen);
    };
  }, [openJournal]);

  useEffect(() => {
    if (searchParams.get("section") !== "journal") {
      return;
    }

    const frame = requestAnimationFrame(() => {
      openJournal();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [openJournal, searchParams]);

  useEffect(() => {
    const handleLogoClose = () => {
      closeJournal();
    };

    const handlePortfolioOpen = () => {
      closeJournal();
    };

    window.addEventListener("tiana:logo-close-content", handleLogoClose);
    window.addEventListener("tiana:open-portfolio", handlePortfolioOpen);

    return () => {
      window.removeEventListener("tiana:logo-close-content", handleLogoClose);
      window.removeEventListener("tiana:open-portfolio", handlePortfolioOpen);
    };
  }, [closeJournal]);

  useEffect(() => {
    const className = "journal-open";

    document.documentElement.classList.toggle(className, isJournalOpen);
    document.body.classList.toggle(className, isJournalOpen);

    return () => {
      document.documentElement.classList.remove(className);
      document.body.classList.remove(className);
    };
  }, [isJournalOpen]);

  const activePost =
    activePostIndex !== null ? posts[activePostIndex] : undefined;
  const isArticleOpen = Boolean(activePost);
  const zoomImages = useMemo(() => {
    if (!activePost) {
      return [] as string[];
    }

    const sources = [activePost.cover, ...(activePost.images ?? [])]
      .map((src) => normalizeImageSrc(src))
      .filter((src) => Boolean(src));

    return Array.from(new Set(sources));
  }, [activePost]);

  const zoomImageSrc = zoomImages[zoomImageIndex] ?? null;
  const canPrevZoomImage = zoomImageIndex > 0;
  const canNextZoomImage = zoomImageIndex < zoomImages.length - 1;
  const prevZoomImageSrc = canPrevZoomImage
    ? zoomImages[zoomImageIndex - 1]
    : zoomImageSrc;
  const nextZoomImageSrc = canNextZoomImage
    ? zoomImages[zoomImageIndex + 1]
    : zoomImageSrc;

  useEffect(() => {
    if (!isJournalOpen || !isMobileViewport()) {
      return;
    }

    if (skipHistoryPushRef.current) {
      skipHistoryPushRef.current = false;
      return;
    }

    if (hasJournalHistoryEntryRef.current) {
      return;
    }

    window.history.pushState(
      { tianaJournal: true, view: "stage" },
      "",
      window.location.href,
    );

    hasJournalHistoryEntryRef.current = true;
  }, [isJournalOpen, isMobileViewport]);

  useEffect(() => {
    if (!isJournalOpen || !isArticleOpen || !isMobileViewport()) {
      if (!isArticleOpen) {
        hasArticleHistoryEntryRef.current = false;
      }
      return;
    }

    if (skipHistoryPushRef.current) {
      skipHistoryPushRef.current = false;
      return;
    }

    if (hasArticleHistoryEntryRef.current) {
      return;
    }

    window.history.pushState(
      { tianaJournal: true, view: "article" },
      "",
      window.location.href,
    );

    hasArticleHistoryEntryRef.current = true;
  }, [isArticleOpen, isJournalOpen, isMobileViewport]);

  useEffect(() => {
    if (
      !isJournalOpen ||
      !isArticleOpen ||
      !isImageZoomOpen ||
      !isMobileViewport()
    ) {
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
      { tianaJournal: true, view: "zoom" },
      "",
      window.location.href,
    );

    hasZoomHistoryEntryRef.current = true;
  }, [isArticleOpen, isImageZoomOpen, isJournalOpen, isMobileViewport]);

  useEffect(() => {
    const handlePopState = () => {
      if (!isMobileViewport() || !isJournalOpen) {
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

      if (isArticleOpen) {
        setActivePostIndex(null);
        setIsImageZoomOpen(false);
        setZoomImageIndex(0);
        hasArticleHistoryEntryRef.current = false;
        hasZoomHistoryEntryRef.current = false;

        requestAnimationFrame(() => {
          skipHistoryPushRef.current = false;
        });
        return;
      }

      closeJournal();

      requestAnimationFrame(() => {
        skipHistoryPushRef.current = false;
      });
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [
    closeJournal,
    isArticleOpen,
    isImageZoomOpen,
    isJournalOpen,
    isMobileViewport,
  ]);

  const handleOpenPost = (postIndex: number) => {
    setActivePostIndex(postIndex);
  };

  const handleCloseArticle = () => {
    setActivePostIndex(null);
    setIsImageZoomOpen(false);
    setZoomImageIndex(0);
    setZoomSwipeOffsetX(0);
    setIsZoomSwipeTransitionEnabled(false);
    hasArticleHistoryEntryRef.current = false;
    hasZoomHistoryEntryRef.current = false;
  };

  const handleOpenImageZoom = (imageSrc: string) => {
    if (!activePost || !imageSrc || zoomImages.length === 0) {
      return;
    }

    const imageIndex = zoomImages.findIndex((source) => source === imageSrc);
    setZoomImageIndex(imageIndex >= 0 ? imageIndex : 0);
    setIsImageZoomOpen(true);
  };

  const handleCloseImageZoom = () => {
    setIsImageZoomOpen(false);
    setZoomImageIndex(0);
    setZoomSwipeOffsetX(0);
    setIsZoomSwipeTransitionEnabled(false);
    hasZoomHistoryEntryRef.current = false;
  };

  const handlePrevZoomImage = () => {
    if (!canPrevZoomImage) {
      return;
    }

    setZoomImageIndex((previous) => Math.max(previous - 1, 0));
  };

  const handleNextZoomImage = () => {
    if (!canNextZoomImage) {
      return;
    }

    setZoomImageIndex((previous) =>
      Math.min(previous + 1, zoomImages.length - 1),
    );
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

  const handleNextPost = () => {
    if (activePostIndex === null || posts.length === 0) {
      return;
    }

    setActivePostIndex((activePostIndex + 1) % posts.length);
  };

  const nextPostTitle = useMemo(() => {
    if (activePostIndex === null || posts.length === 0) {
      return "";
    }

    return posts[(activePostIndex + 1) % posts.length]?.title;
  }, [activePostIndex, posts]);

  useEffect(() => {
    if (posts.length === 0) {
      setActivePostIndex(null);
      return;
    }

    setActivePostIndex((prev) => {
      if (prev === null) {
        return prev;
      }

      return Math.min(prev, posts.length - 1);
    });
  }, [posts]);

  useEffect(() => {
    if (zoomImages.length === 0) {
      setZoomImageIndex(0);
      return;
    }

    setZoomImageIndex((previous) => Math.min(previous, zoomImages.length - 1));
    setZoomSwipeOffsetX(0);
  }, [zoomImages]);

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
        className={`${styles.journalStage} ${isJournalOpen ? styles.journalStageVisible : ""}`}
        aria-label="Журнал"
        aria-hidden={!isJournalOpen}
      >
        <div className={styles.journalIntro}>
          <p className={styles.journalKicker}>Журнал</p>
          <h2 className={styles.journalTitle}>
            Истории, заметки и советы ателье
          </h2>
        </div>

        <div className={styles.journalGrid}>
          {posts.map((post, postIndex) => (
            <article
              key={post.id}
              className={styles.journalCard}
              style={{ "--journal-index": postIndex } as CSSProperties}
            >
              <button
                type="button"
                className={styles.journalCardButton}
                onClick={() => handleOpenPost(postIndex)}
                aria-label={`Открыть статью: ${post.title}`}
              >
                <div className={styles.journalMedia}>
                  <Image
                    src={normalizeImageSrc(post.cover)}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={styles.journalImage}
                  />
                </div>
                <h3 className={styles.journalCardTitle}>{post.title}</h3>
                <p className={styles.journalCardText}>{post.excerpt}</p>
              </button>
            </article>
          ))}
        </div>
      </section>

      <section
        className={`${styles.articleOverlay} ${isArticleOpen ? styles.articleOverlayVisible : ""}`}
        aria-hidden={!isArticleOpen}
      >
        <button
          type="button"
          className={styles.articleBackdrop}
          onClick={handleCloseArticle}
          aria-label="Закрыть статью"
        />

        {activePost ? (
          <div className={styles.articlePanel} role="dialog" aria-modal="true">
            <aside className={styles.articleSidebar}>
              {posts.map((post, postIndex) => (
                <button
                  key={post.id}
                  type="button"
                  className={`${styles.sidebarPostButton} ${postIndex === activePostIndex ? styles.sidebarPostButtonActive : ""}`}
                  onClick={() => setActivePostIndex(postIndex)}
                  aria-label={`Перейти к статье: ${post.title}`}
                >
                  {post.title}
                </button>
              ))}
            </aside>

            <div className={styles.articleContentWrap}>
              <button
                type="button"
                className={styles.articleClose}
                onClick={handleCloseArticle}
                aria-label="Закрыть"
              >
                <svg
                  viewBox="0 0 24 24"
                  className={styles.articleIcon}
                  aria-hidden="true"
                >
                  <path d="M6.7 5.3a1 1 0 0 1 1.4 0L12 9.2l3.9-3.9a1 1 0 1 1 1.4 1.4L13.4 10.6l3.9 3.9a1 1 0 1 1-1.4 1.4L12 12l-3.9 3.9a1 1 0 1 1-1.4-1.4l3.9-3.9-3.9-3.9a1 1 0 0 1 0-1.4Z" />
                </svg>
              </button>

              <div className={styles.articleHero}>
                <button
                  type="button"
                  className={styles.articleHeroButton}
                  onClick={() =>
                    handleOpenImageZoom(normalizeImageSrc(activePost.cover))
                  }
                  aria-label="Открыть изображение полностью"
                >
                  <Image
                    src={normalizeImageSrc(activePost.cover)}
                    alt={activePost.title}
                    fill
                    sizes="(max-width: 900px) 100vw, 66vw"
                    className={styles.articleHeroImage}
                  />
                </button>
              </div>

              <article className={styles.articleBody}>
                <h3 className={styles.articleTitle}>{activePost.title}</h3>
                <p className={styles.articleLead}>{activePost.excerpt}</p>

                {(activePost.images ?? []).length > 0 ? (
                  <div className={styles.articleGallery}>
                    {(activePost.images ?? []).map((image, imageIndex) => (
                      <button
                        key={`${activePost.id}-gallery-${imageIndex}`}
                        type="button"
                        className={styles.articleGalleryItem}
                        onClick={() =>
                          handleOpenImageZoom(normalizeImageSrc(image))
                        }
                        aria-label={`Открыть изображение ${imageIndex + 1}`}
                      >
                        <Image
                          src={normalizeImageSrc(image)}
                          alt={`${activePost.title} — фото ${imageIndex + 1}`}
                          fill
                          sizes="(max-width: 900px) 40vw, 220px"
                          className={styles.articleGalleryImage}
                        />
                      </button>
                    ))}
                  </div>
                ) : null}

                {activePost.sections.map((section) => (
                  <section
                    key={section.heading}
                    className={styles.articleSection}
                  >
                    <h4 className={styles.articleSectionTitle}>
                      {section.heading}
                    </h4>
                    <p className={styles.articleSectionText}>{section.text}</p>
                  </section>
                ))}

                <button
                  type="button"
                  className={styles.articleNextButton}
                  onClick={handleNextPost}
                  aria-label={`Открыть следующую статью: ${nextPostTitle}`}
                >
                  Следующий пост →
                </button>
              </article>
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
          aria-label="Закрыть полноэкранное изображение"
        />

        {activePost && zoomImageSrc ? (
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
                className={styles.articleIcon}
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
                style={
                  {
                    transform: `translateX(calc(-33.333333% + ${zoomSwipeOffsetX}px))`,
                    transition: isZoomSwipeTransitionEnabled
                      ? "transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1)"
                      : "none",
                  } as CSSProperties
                }
              >
                <div className={styles.imageZoomSlide}>
                  <Image
                    src={prevZoomImageSrc ?? zoomImageSrc}
                    alt={activePost.title}
                    fill
                    sizes="100vw"
                    className={styles.imageZoomImage}
                  />
                </div>

                <div className={styles.imageZoomSlide}>
                  <Image
                    src={zoomImageSrc}
                    alt={activePost.title}
                    fill
                    sizes="100vw"
                    className={styles.imageZoomImage}
                  />
                </div>

                <div className={styles.imageZoomSlide}>
                  <Image
                    src={nextZoomImageSrc ?? zoomImageSrc}
                    alt={activePost.title}
                    fill
                    sizes="100vw"
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

              <p className={styles.imageZoomCounter}>
                {zoomImageIndex + 1} / {zoomImages.length}
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
