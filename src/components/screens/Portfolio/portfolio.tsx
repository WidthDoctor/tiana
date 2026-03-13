"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, TouchEvent } from "react";
import { useSearchParams } from "next/navigation";
import { erasLight } from "../../../app/fonts";
import type { PortfolioBride } from "../../../lib/portfolio";
import styles from "./PortfolioDesktop.module.css";
import PortfolioMobile from "./portfolioMobile";
import Tiles from "./Tiles";

const MOBILE_BRIDE_GAP_PX = 50;

type PortfolioProps = {
  portfolioBrides: PortfolioBride[];
};

export default function Portfolio({ portfolioBrides }: PortfolioProps) {
  const searchParams = useSearchParams();
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [activeBrideIndex, setActiveBrideIndex] = useState<number | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [mobileBrideIndex, setMobileBrideIndex] = useState(0);
  const [mobileSelectedBrideIndex, setMobileSelectedBrideIndex] = useState<
    number | null
  >(null);
  const [lastViewedMobileBrideIndex, setLastViewedMobileBrideIndex] = useState<
    number | null
  >(null);
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
  const hasPortfolioHistoryEntryRef = useRef(false);

  const isMobileViewport = useCallback(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(max-width: 900px)").matches;
  }, []);

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
    setMobileSelectedBrideIndex(null);
    setLastViewedMobileBrideIndex(null);
    hasPortfolioHistoryEntryRef.current = false;
  }, []);

  const openMobileBrideFromTile = useCallback(
    (brideIndex: number) => {
      setMobileBrideIndex(brideIndex);
      setMobilePhotoIndex(0);
      setMobileSelectedBrideIndex(brideIndex);
      setLastViewedMobileBrideIndex(brideIndex);

      if (!isMobileViewport()) {
        return;
      }

      window.history.pushState(
        { tianaPortfolio: true, view: "mobile-viewer" },
        "",
        window.location.href,
      );
    },
    [isMobileViewport],
  );

  const closeMobileViewer = useCallback(() => {
    if (mobileSelectedBrideIndex === null) {
      return;
    }

    if (isMobileViewport()) {
      window.history.back();
      return;
    }

    setLastViewedMobileBrideIndex(mobileBrideIndex);
    setMobileSelectedBrideIndex(null);
    setMobilePhotoIndex(0);
    setMobileTrackOffsetX(0);
    setMobileTrackOffsetY(0);
    setIsMobileTrackTransitionEnabled(false);
    setIsMobileBrideTransitionEnabled(false);
  }, [isMobileViewport, mobileBrideIndex, mobileSelectedBrideIndex]);

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
    const handleJournalOpen = () => {
      closePortfolio();
    };

    const handleAccessoriesOpen = () => {
      closePortfolio();
    };

    window.addEventListener("tiana:open-journal", handleJournalOpen);
    window.addEventListener("tiana:open-accessories", handleAccessoriesOpen);

    return () => {
      window.removeEventListener("tiana:open-journal", handleJournalOpen);
      window.removeEventListener(
        "tiana:open-accessories",
        handleAccessoriesOpen,
      );
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
    if (
      !isPortfolioOpen ||
      !isMobileViewport() ||
      hasPortfolioHistoryEntryRef.current
    ) {
      return;
    }

    window.history.pushState(
      { tianaPortfolio: true, view: "mobile-tiles" },
      "",
      window.location.href,
    );

    hasPortfolioHistoryEntryRef.current = true;
  }, [isMobileViewport, isPortfolioOpen]);

  useEffect(() => {
    const handlePopState = () => {
      if (!isPortfolioOpen || !isMobileViewport()) {
        return;
      }

      if (mobileSelectedBrideIndex !== null) {
        setLastViewedMobileBrideIndex(mobileBrideIndex);
        setMobileSelectedBrideIndex(null);
        setMobilePhotoIndex(0);
        setMobileTrackOffsetX(0);
        setMobileTrackOffsetY(0);
        setIsMobileTrackTransitionEnabled(false);
        setIsMobileBrideTransitionEnabled(false);
        return;
      }

      closePortfolio();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [
    closePortfolio,
    isMobileViewport,
    mobileBrideIndex,
    isPortfolioOpen,
    mobileSelectedBrideIndex,
  ]);

  useEffect(() => {
    return () => {
      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const node = mobileFeedRef.current;

    if (!node || mobileSelectedBrideIndex === null) {
      return;
    }

    const updateHeight = () => {
      setMobileFeedHeight(node.clientHeight);
    };

    const frame = requestAnimationFrame(() => {
      updateHeight();
    });
    window.addEventListener("resize", updateHeight);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateHeight);
    };
  }, [isPortfolioOpen, mobileSelectedBrideIndex]);

  const activeMobileBride = bridesWithPhotos[mobileBrideIndex];

  const showNextBride = useCallback(() => {
    if (bridesWithPhotos.length === 0) {
      return;
    }

    setMobileBrideIndex((prev) =>
      prev >= bridesWithPhotos.length - 1 ? 0 : prev + 1,
    );
    setMobilePhotoIndex(0);
  }, [bridesWithPhotos.length]);

  const showPrevBride = useCallback(() => {
    if (bridesWithPhotos.length === 0) {
      return;
    }

    setMobileBrideIndex((prev) =>
      prev === 0 ? bridesWithPhotos.length - 1 : prev - 1,
    );
    setMobilePhotoIndex(0);
  }, [bridesWithPhotos.length]);

  const showNextPhoto = useCallback(() => {
    if (!activeMobileBride) {
      return;
    }

    setMobilePhotoIndex((prev) =>
      Math.min(prev + 1, activeMobileBride.photos.length - 1),
    );
  }, [activeMobileBride]);

  const showPrevPhoto = useCallback(() => {
    if (!activeMobileBride) {
      return;
    }

    setMobilePhotoIndex((prev) => Math.max(prev - 1, 0));
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
    const maxPhotoIndex = Math.max(
      (activeMobileBride?.photos.length ?? 1) - 1,
      0,
    );
    const isFirstPhoto = mobilePhotoIndex <= 0;
    const isLastPhoto = mobilePhotoIndex >= maxPhotoIndex;

    let adjustedDeltaX = deltaX;

    if (isFirstPhoto && adjustedDeltaX > 0) {
      adjustedDeltaX = 0;
    }

    if (isLastPhoto && adjustedDeltaX < 0) {
      adjustedDeltaX = 0;
    }

    const clampedDeltaX = Math.max(Math.min(adjustedDeltaX, width), -width);
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
        const canNavigate = isNextPhoto
          ? mobilePhotoIndex < mobilePhotoCount - 1
          : mobilePhotoIndex > 0;

        if (!canNavigate) {
          setMobileTrackOffsetX(0);
          touchStartRef.current = null;
          touchAxisRef.current = null;
          return;
        }

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
  const canPrevPhoto = mobilePhotoIndex > 0;
  const canNextPhoto = mobilePhotoIndex < mobilePhotoCount - 1;
  const prevMobilePhoto =
    mobilePhotoCount > 0 && canPrevPhoto
      ? mobilePhotos[mobilePhotoIndex - 1]
      : currentMobilePhoto;
  const nextMobilePhoto =
    mobilePhotoCount > 0 && canNextPhoto
      ? mobilePhotos[mobilePhotoIndex + 1]
      : currentMobilePhoto;

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
    <>
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
            <Tiles
              brides={bridesWithPhotos}
              onSelect={openMobileBrideFromTile}
              isVisible={mobileSelectedBrideIndex === null}
              activeBrideIndex={lastViewedMobileBrideIndex}
            />

            <PortfolioMobile
              activeMobileBride={activeMobileBride}
              prevMobileBride={prevMobileBride}
              nextMobileBride={nextMobileBride}
              prevMobileBridePhoto={prevMobileBridePhoto}
              nextMobileBridePhoto={nextMobileBridePhoto}
              prevMobilePhoto={prevMobilePhoto}
              currentMobilePhoto={currentMobilePhoto}
              nextMobilePhoto={nextMobilePhoto}
              mobilePhotoIndex={mobilePhotoIndex}
              mobilePhotoCount={mobilePhotoCount}
              mobileTrackOffsetX={mobileTrackOffsetX}
              mobileTrackOffsetY={mobileTrackOffsetY}
              mobileBrideBaseShift={mobileBrideBaseShift}
              isMobileBrideTransitionEnabled={isMobileBrideTransitionEnabled}
              isMobileTrackTransitionEnabled={isMobileTrackTransitionEnabled}
              mobileFeedRef={mobileFeedRef}
              mobilePhotoViewportRef={mobilePhotoViewportRef}
              onTouchStart={handleFeedTouchStart}
              onTouchMove={handleFeedTouchMove}
              onTouchEnd={handleFeedTouchEnd}
              canPrevPhoto={canPrevPhoto}
              canNextPhoto={canNextPhoto}
              onPrevPhoto={showPrevPhoto}
              onNextPhoto={showNextPhoto}
              onClose={closeMobileViewer}
              isVisible={mobileSelectedBrideIndex !== null}
            />

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
    </>
  );
}
