"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, TouchEvent } from "react";
import { useSearchParams } from "next/navigation";
import { erasLight } from "../../../app/fonts";
import type { PortfolioBride } from "../../../lib/portfolio";
import styles from "./Home.module.css";
import NavbarMini from "./NavbarMini";
import NavigationGeneral from "./NavigationGeneral";

const MOBILE_BRIDE_GAP_PX = 50;

type HomeProps = {
  portfolioBrides: PortfolioBride[];
};

export default function Home({ portfolioBrides }: HomeProps) {
  const searchParams = useSearchParams();
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [activeBrideIndex, setActiveBrideIndex] = useState<number | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [mobileBrideIndex, setMobileBrideIndex] = useState(0);
  const [mobilePhotoIndex, setMobilePhotoIndex] = useState(0);
  const [mobileTrackOffsetX, setMobileTrackOffsetX] = useState(0);
  const [mobileTrackOffsetY, setMobileTrackOffsetY] = useState(0);
  const [mobileFeedHeight, setMobileFeedHeight] = useState(0);
  const [isMobileTrackTransitionEnabled, setIsMobileTrackTransitionEnabled] =
    useState(false);
  const [isMobileBrideTransitionEnabled, setIsMobileBrideTransitionEnabled] =
    useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const mobileFeedRef = useRef<HTMLElement | null>(null);
  const mobilePhotoViewportRef = useRef<HTMLDivElement | null>(null);
  const touchAxisRef = useRef<"x" | "y" | null>(null);
  const feedWidthRef = useRef(0);
  const feedHeightRef = useRef(0);
  const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bridesWithPhotos = useMemo(
    () => portfolioBrides.filter((bride) => bride.photos.length > 0),
    [portfolioBrides],
  );

  const hasPortfolioPhotos = bridesWithPhotos.length > 0;

  const openPortfolio = useCallback(() => {
    if (hasPortfolioPhotos) {
      setIsPortfolioOpen(true);
    }
  }, [hasPortfolioPhotos]);

  useEffect(() => {
    const handlePortfolioOpen = () => {
      openPortfolio();
    };

    window.addEventListener("tiana:open-portfolio", handlePortfolioOpen);

    return () => {
      window.removeEventListener("tiana:open-portfolio", handlePortfolioOpen);
    };
  }, [openPortfolio]);

  useEffect(() => {
    if (searchParams.get("section") !== "portfolio") {
      return;
    }

    const frame = requestAnimationFrame(() => {
      openPortfolio();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [openPortfolio, searchParams]);

  const handleHeroPortfolioClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    openPortfolio();
  };

  const closePortfolio = useCallback(() => {
    setIsPortfolioOpen(false);
    setActiveBrideIndex(null);
    setActivePhotoIndex(0);
    setMobileBrideIndex(0);
    setMobilePhotoIndex(0);
    setMobileTrackOffsetX(0);
    setMobileTrackOffsetY(0);
    setIsMobileTrackTransitionEnabled(false);
    setIsMobileBrideTransitionEnabled(false);
  }, []);

  const openBrideViewer = (brideIndex: number) => {
    setActiveBrideIndex(brideIndex);
    setActivePhotoIndex(0);
  };

  const closeBrideViewer = () => {
    setActiveBrideIndex(null);
    setActivePhotoIndex(0);
  };

  const activeBride =
    activeBrideIndex !== null ? bridesWithPhotos[activeBrideIndex] : undefined;
  const isViewerOpen = Boolean(activeBride);

  const handlePrevPhoto = useCallback(() => {
    if (!activeBride) {
      return;
    }

    setActivePhotoIndex((prev) =>
      prev === 0 ? activeBride.photos.length - 1 : prev - 1,
    );
  }, [activeBride]);

  const handleNextPhoto = useCallback(() => {
    if (!activeBride) {
      return;
    }

    setActivePhotoIndex((prev) =>
      prev === activeBride.photos.length - 1 ? 0 : prev + 1,
    );
  }, [activeBride]);

  useEffect(() => {
    if (!isViewerOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeBrideViewer();
        return;
      }

      if (event.key === "ArrowLeft") {
        handlePrevPhoto();
      }

      if (event.key === "ArrowRight") {
        handleNextPhoto();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNextPhoto, handlePrevPhoto, isViewerOpen]);

  useEffect(() => {
    const handleLogoClose = () => {
      closePortfolio();
    };

    window.addEventListener("tiana:logo-close-content", handleLogoClose);

    return () => {
      window.removeEventListener("tiana:logo-close-content", handleLogoClose);
    };
  }, [closePortfolio]);

  useEffect(() => {
    const className = "portfolio-open";

    document.documentElement.classList.toggle(className, isPortfolioOpen);
    document.body.classList.toggle(className, isPortfolioOpen);

    return () => {
      document.documentElement.classList.remove(className);
      document.body.classList.remove(className);
    };
  }, [isPortfolioOpen]);

  useEffect(() => {
    return () => {
      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const node = mobileFeedRef.current;

    if (!node) {
      return;
    }

    const updateHeight = () => {
      setMobileFeedHeight(node.clientHeight);
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  }, [isPortfolioOpen]);

  const activeMobileBride = bridesWithPhotos[mobileBrideIndex];

  const showNextBride = useCallback(() => {
    if (bridesWithPhotos.length === 0) {
      return;
    }

    setMobileBrideIndex((prev) => {
      const nextIndex = prev >= bridesWithPhotos.length - 1 ? 0 : prev + 1;
      return nextIndex;
    });
    setMobilePhotoIndex(0);
  }, [bridesWithPhotos.length]);

  const showPrevBride = useCallback(() => {
    if (bridesWithPhotos.length === 0) {
      return;
    }

    setMobileBrideIndex((prev) => {
      const nextIndex = prev === 0 ? bridesWithPhotos.length - 1 : prev - 1;
      return nextIndex;
    });
    setMobilePhotoIndex(0);
  }, [bridesWithPhotos.length]);

  const showNextPhoto = useCallback(() => {
    if (!activeMobileBride) {
      return;
    }

    setMobilePhotoIndex((prev) =>
      prev >= activeMobileBride.photos.length - 1 ? 0 : prev + 1,
    );
  }, [activeMobileBride]);

  const showPrevPhoto = useCallback(() => {
    if (!activeMobileBride) {
      return;
    }

    setMobilePhotoIndex((prev) =>
      prev === 0 ? activeMobileBride.photos.length - 1 : prev - 1,
    );
  }, [activeMobileBride]);

  const handleFeedTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];

    if (snapTimeoutRef.current) {
      clearTimeout(snapTimeoutRef.current);
    }

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };

    touchAxisRef.current = null;
    feedWidthRef.current =
      mobilePhotoViewportRef.current?.clientWidth ??
      event.currentTarget.clientWidth;
    feedHeightRef.current = event.currentTarget.clientHeight;
    if (mobileFeedHeight !== event.currentTarget.clientHeight) {
      setMobileFeedHeight(event.currentTarget.clientHeight);
    }
    setIsMobileTrackTransitionEnabled(false);
    setIsMobileBrideTransitionEnabled(false);
  };

  const handleFeedTouchMove = (event: TouchEvent<HTMLElement>) => {
    const start = touchStartRef.current;
    const touch = event.touches[0];

    if (!start || !touch) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (!touchAxisRef.current && (absX > 8 || absY > 8)) {
      touchAxisRef.current = absX >= absY ? "x" : "y";
    }

    if (touchAxisRef.current === "y") {
      const height = Math.max(feedHeightRef.current, 1);
      const clampedDeltaY = Math.max(Math.min(deltaY, height), -height);
      setMobileTrackOffsetY(clampedDeltaY);
      return;
    }

    if (touchAxisRef.current !== "x") {
      return;
    }

    const width = Math.max(feedWidthRef.current, 1);
    const clampedDeltaX = Math.max(Math.min(deltaX, width), -width);
    setMobileTrackOffsetX(clampedDeltaX);
  };

  const handleFeedTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];

    if (!start || !touch) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (touchAxisRef.current === "x") {
      const width = Math.max(feedWidthRef.current, 1);
      const threshold = width * 0.2;

      setIsMobileTrackTransitionEnabled(true);

      if (absX > threshold) {
        const isNextPhoto = deltaX < 0;
        setMobileTrackOffsetX(isNextPhoto ? -width : width);

        snapTimeoutRef.current = setTimeout(() => {
          if (isNextPhoto) {
            showNextPhoto();
          } else {
            showPrevPhoto();
          }

          setIsMobileTrackTransitionEnabled(false);
          setMobileTrackOffsetX(0);

          requestAnimationFrame(() => {
            setIsMobileTrackTransitionEnabled(true);
          });
        }, 180);

        touchStartRef.current = null;
        touchAxisRef.current = null;
        return;
      }

      setMobileTrackOffsetX(0);
      touchStartRef.current = null;
      touchAxisRef.current = null;
      return;
    }

    if (touchAxisRef.current === "y") {
      const height = Math.max(feedHeightRef.current, 1);
      const threshold = height * 0.16;

      setIsMobileBrideTransitionEnabled(true);

      if (absY > threshold) {
        const isNextBride = deltaY < 0;
        const targetOffset = isNextBride
          ? -(height + MOBILE_BRIDE_GAP_PX)
          : height + MOBILE_BRIDE_GAP_PX;

        setMobileTrackOffsetY(targetOffset);

        snapTimeoutRef.current = setTimeout(() => {
          if (isNextBride) {
            showNextBride();
          } else {
            showPrevBride();
          }

          setIsMobileBrideTransitionEnabled(false);
          setMobileTrackOffsetY(0);
          setMobileTrackOffsetX(0);
        }, 200);

        touchStartRef.current = null;
        touchAxisRef.current = null;
        return;
      }

      setMobileTrackOffsetY(0);
      touchStartRef.current = null;
      touchAxisRef.current = null;
      return;
    }

    if (absY > 44) {
      if (deltaY < 0) {
        showNextBride();
      } else {
        showPrevBride();
      }
    }

    touchStartRef.current = null;
    touchAxisRef.current = null;
  };

  const mobilePhotos = activeMobileBride?.photos ?? [];
  const mobilePhotoCount = mobilePhotos.length;
  const currentMobilePhoto = mobilePhotos[mobilePhotoIndex] ?? "";
  const prevMobilePhoto =
    mobilePhotoCount > 0
      ? mobilePhotos[
          (mobilePhotoIndex - 1 + mobilePhotoCount) % mobilePhotoCount
        ]
      : "";
  const nextMobilePhoto =
    mobilePhotoCount > 0
      ? mobilePhotos[(mobilePhotoIndex + 1) % mobilePhotoCount]
      : "";

  const prevMobileBride =
    bridesWithPhotos.length > 0
      ? bridesWithPhotos[
          (mobileBrideIndex - 1 + bridesWithPhotos.length) %
            bridesWithPhotos.length
        ]
      : undefined;
  const nextMobileBride =
    bridesWithPhotos.length > 0
      ? bridesWithPhotos[(mobileBrideIndex + 1) % bridesWithPhotos.length]
      : undefined;

  const prevMobileBridePhoto = prevMobileBride?.photos[0] ?? "";
  const nextMobileBridePhoto = nextMobileBride?.photos[0] ?? "";
  const mobileBrideBaseShift =
    mobileFeedHeight > 0 ? mobileFeedHeight + MOBILE_BRIDE_GAP_PX : 0;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <NavbarMini />
        <NavigationGeneral logoClassName={erasLight.className} />
      </header>

      <section
        className={`${styles.content} ${isPortfolioOpen ? styles.contentShifted : ""}`}
        aria-label="Главный экран"
      >
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
            <Link href="/appointment" className={styles.heroPrimaryAction}>
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

      <section
        className={`${styles.portfolioStage} ${isPortfolioOpen ? styles.portfolioStageVisible : ""}`}
        aria-label="Портфолио невест"
        aria-hidden={!isPortfolioOpen}
      >
        <div className={styles.portfolioIntro}>
          <p className={styles.portfolioKicker}>Портфолио</p>
          <h2 className={`${styles.portfolioTitle} ${erasLight.className}`}>
            Реальные образы наших невест
          </h2>
        </div>

        {bridesWithPhotos.length > 0 ? (
          <>
            <section
              className={styles.mobilePortfolioFeed}
              aria-label="Мобильная галерея"
              ref={mobileFeedRef}
              onTouchStart={handleFeedTouchStart}
              onTouchMove={handleFeedTouchMove}
              onTouchEnd={handleFeedTouchEnd}
            >
              {activeMobileBride ? (
                <article className={styles.mobilePortfolioCard}>
                  <div
                    className={styles.mobileBrideTrack}
                    style={{
                      transform: `translateY(${mobileTrackOffsetY - mobileBrideBaseShift}px)`,
                      transition: isMobileBrideTransitionEnabled
                        ? "transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1)"
                        : "none",
                    }}
                  >
                    <div
                      ref={mobilePhotoViewportRef}
                      className={styles.mobileBrideSlide}
                    >
                      {prevMobileBride ? (
                        <>
                          <div className={styles.mobilePortfolioMedia}>
                            <Image
                              src={prevMobileBridePhoto}
                              alt={`${prevMobileBride.name} — соседняя невеста`}
                              fill
                              sizes="100vw"
                              className={styles.mobilePortfolioImage}
                              priority
                            />
                          </div>
                          <div className={styles.mobileNeighborLabel}>
                            {prevMobileBride.name}
                          </div>
                        </>
                      ) : null}
                    </div>

                    <div className={styles.mobileBrideSlide}>
                      <div
                        className={styles.mobilePortfolioTrack}
                        style={{
                          transform: `translateX(calc(-33.333333% + ${mobileTrackOffsetX}px))`,
                          transition: isMobileTrackTransitionEnabled
                            ? "transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1)"
                            : "none",
                        }}
                      >
                        <div className={styles.mobilePortfolioSlide}>
                          <div className={styles.mobilePortfolioMedia}>
                            <Image
                              src={prevMobilePhoto}
                              alt={`${activeMobileBride.name} — фото ${Math.max(mobilePhotoIndex, 1)}`}
                              fill
                              sizes="100vw"
                              className={styles.mobilePortfolioImage}
                              priority
                            />
                          </div>
                        </div>

                        <div className={styles.mobilePortfolioSlide}>
                          <div className={styles.mobilePortfolioMedia}>
                            <Image
                              src={currentMobilePhoto}
                              alt={`${activeMobileBride.name} — фото ${mobilePhotoIndex + 1}`}
                              fill
                              sizes="100vw"
                              className={styles.mobilePortfolioImage}
                              priority
                            />
                          </div>
                        </div>

                        <div className={styles.mobilePortfolioSlide}>
                          <div className={styles.mobilePortfolioMedia}>
                            <Image
                              src={nextMobilePhoto}
                              alt={`${activeMobileBride.name} — фото ${Math.min(mobilePhotoIndex + 2, mobilePhotoCount)}`}
                              fill
                              sizes="100vw"
                              className={styles.mobilePortfolioImage}
                              priority
                            />
                          </div>
                        </div>
                      </div>

                      <div className={styles.mobilePortfolioOverlay}>
                        <p className={styles.mobilePortfolioBride}>
                          {activeMobileBride.name}
                        </p>
                        <p className={styles.mobilePortfolioMeta}>
                          Фото {mobilePhotoIndex + 1} /{" "}
                          {activeMobileBride.photos.length}
                        </p>
                        <p className={styles.mobilePortfolioHint}>
                          Влево — предыдущее фото • Вправо — следующее фото
                        </p>
                        <p className={styles.mobilePortfolioHint}>
                          Вверх/вниз — невеста
                        </p>
                      </div>
                    </div>

                    <div className={styles.mobileBrideSlide}>
                      {nextMobileBride ? (
                        <>
                          <div className={styles.mobilePortfolioMedia}>
                            <Image
                              src={nextMobileBridePhoto}
                              alt={`${nextMobileBride.name} — соседняя невеста`}
                              fill
                              sizes="100vw"
                              className={styles.mobilePortfolioImage}
                              priority
                            />
                          </div>
                          <div className={styles.mobileNeighborLabel}>
                            {nextMobileBride.name}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </article>
              ) : null}
            </section>

            <div className={styles.portfolioGrid}>
              {bridesWithPhotos.map((bride, brideIndex) => (
                <figure
                  key={bride.id}
                  className={styles.portfolioCard}
                  style={{ "--reveal-index": brideIndex } as CSSProperties}
                >
                  <button
                    type="button"
                    className={styles.portfolioCardButton}
                    onClick={() => openBrideViewer(brideIndex)}
                    aria-label={`Открыть фотосессию: ${bride.name}`}
                  >
                    <div className={styles.portfolioMedia}>
                      <Image
                        src={bride.photos[0]}
                        alt={`${bride.name} — свадебное платье от Tiana`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={styles.portfolioImage}
                      />
                    </div>
                  </button>
                  <figcaption className={styles.portfolioCaption}>
                    {bride.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </>
        ) : (
          <p className={styles.portfolioEmpty}>
            В портфолио пока нет фотографий. Добавьте изображения в
            public/images/portfolio/&lt;имя-невесты&gt;/.
          </p>
        )}
      </section>

      <section
        className={`${styles.viewerOverlay} ${isViewerOpen ? styles.viewerOverlayVisible : ""}`}
        aria-hidden={!isViewerOpen}
      >
        <button
          type="button"
          className={styles.viewerBackdrop}
          onClick={closeBrideViewer}
          aria-label="Закрыть просмотр"
        />

        {activeBride ? (
          <div className={styles.viewerPanel} role="dialog" aria-modal="true">
            <button
              type="button"
              className={styles.viewerClose}
              onClick={closeBrideViewer}
              aria-label="Закрыть"
            >
              <svg
                viewBox="0 0 24 24"
                className={styles.viewerIcon}
                aria-hidden="true"
              >
                <path d="M6.7 5.3a1 1 0 0 1 1.4 0L12 9.2l3.9-3.9a1 1 0 1 1 1.4 1.4L13.4 10.6l3.9 3.9a1 1 0 1 1-1.4 1.4L12 12l-3.9 3.9a1 1 0 1 1-1.4-1.4l3.9-3.9-3.9-3.9a1 1 0 0 1 0-1.4Z" />
              </svg>
            </button>

            <div className={styles.viewerMain}>
              <button
                type="button"
                className={styles.viewerNav}
                onClick={handlePrevPhoto}
                aria-label="Предыдущее фото"
              >
                <svg
                  viewBox="0 0 24 24"
                  className={styles.viewerIcon}
                  aria-hidden="true"
                >
                  <path d="M14.7 5.3a1 1 0 0 1 0 1.4L9.4 12l5.3 5.3a1 1 0 0 1-1.4 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.4 0Z" />
                </svg>
              </button>

              <div className={styles.viewerMedia}>
                <Image
                  src={activeBride.photos[activePhotoIndex]}
                  alt={`${activeBride.name} — фото ${activePhotoIndex + 1}`}
                  fill
                  sizes="(max-width: 900px) 92vw, 72vw"
                  className={styles.viewerImage}
                />
              </div>

              <button
                type="button"
                className={styles.viewerNav}
                onClick={handleNextPhoto}
                aria-label="Следующее фото"
              >
                <svg
                  viewBox="0 0 24 24"
                  className={styles.viewerIcon}
                  aria-hidden="true"
                >
                  <path d="M9.3 5.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4-1.4l5.3-5.3-5.3-5.3a1 1 0 0 1 0-1.4Z" />
                </svg>
              </button>
            </div>

            <div className={styles.viewerFooter}>
              <p className={styles.viewerTitle}>{activeBride.name}</p>
              <p className={styles.viewerCount}>
                {activePhotoIndex + 1} / {activeBride.photos.length}
              </p>
            </div>

            <div className={styles.viewerThumbs}>
              {activeBride.photos.map((photo, photoIndex) => (
                <button
                  key={photo}
                  type="button"
                  className={`${styles.viewerThumb} ${activePhotoIndex === photoIndex ? styles.viewerThumbActive : ""}`}
                  onClick={() => setActivePhotoIndex(photoIndex)}
                  aria-label={`Открыть фото ${photoIndex + 1}`}
                >
                  <Image
                    src={photo}
                    alt={`${activeBride.name} — миниатюра ${photoIndex + 1}`}
                    fill
                    sizes="72px"
                    className={styles.viewerThumbImage}
                  />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
