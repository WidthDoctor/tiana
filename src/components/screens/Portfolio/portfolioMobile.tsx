import Image from "next/image";
import type { CSSProperties, RefObject, TouchEvent } from "react";
import type { PortfolioBride } from "../../../lib/portfolio";
import styles from "./PortfolioMobile.module.css";

type PortfolioMobileProps = {
  activeMobileBride: PortfolioBride | undefined;
  prevMobileBride: PortfolioBride | undefined;
  nextMobileBride: PortfolioBride | undefined;
  prevMobileBridePhoto: string;
  nextMobileBridePhoto: string;
  prevMobilePhoto: string;
  currentMobilePhoto: string;
  nextMobilePhoto: string;
  mobilePhotoIndex: number;
  mobilePhotoCount: number;
  mobileTrackOffsetX: number;
  mobileTrackOffsetY: number;
  mobileBrideBaseShift: number;
  isMobileBrideTransitionEnabled: boolean;
  isMobileTrackTransitionEnabled: boolean;
  mobileFeedRef: RefObject<HTMLElement | null>;
  mobilePhotoViewportRef: RefObject<HTMLDivElement | null>;
  onTouchStart: (event: TouchEvent<HTMLElement>) => void;
  onTouchMove: (event: TouchEvent<HTMLElement>) => void;
  onTouchEnd: (event: TouchEvent<HTMLElement>) => void;
  canPrevPhoto: boolean;
  canNextPhoto: boolean;
  onPrevPhoto: () => void;
  onNextPhoto: () => void;
  onClose: () => void;
  isVisible: boolean;
};

export default function PortfolioMobile({
  activeMobileBride,
  prevMobileBride,
  nextMobileBride,
  prevMobileBridePhoto,
  nextMobileBridePhoto,
  prevMobilePhoto,
  currentMobilePhoto,
  nextMobilePhoto,
  mobilePhotoIndex,
  mobilePhotoCount,
  mobileTrackOffsetX,
  mobileTrackOffsetY,
  mobileBrideBaseShift,
  isMobileBrideTransitionEnabled,
  isMobileTrackTransitionEnabled,
  mobileFeedRef,
  mobilePhotoViewportRef,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  canPrevPhoto,
  canNextPhoto,
  onPrevPhoto,
  onNextPhoto,
  onClose,
  isVisible,
}: PortfolioMobileProps) {
  const handleCloseTouchStart = (event: TouchEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  const handleCloseTouchMove = (event: TouchEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  const handleCloseTouchEnd = (event: TouchEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };

  return (
    <section
      className={`${styles.mobilePortfolioFeed} ${isVisible ? styles.mobilePortfolioFeedVisible : styles.mobilePortfolioFeedHidden}`}
      aria-label="Мобильная галерея"
      inert={!isVisible}
      ref={mobileFeedRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {activeMobileBride ? (
        <article className={styles.mobilePortfolioCard}>
          <div
            className={styles.mobileBrideTrack}
            style={
              {
                transform: `translateY(${mobileTrackOffsetY - mobileBrideBaseShift}px)`,
                transition: isMobileBrideTransitionEnabled
                  ? "transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1)"
                  : "none",
              } as CSSProperties
            }
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
                      loading="lazy"
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
                style={
                  {
                    transform: `translateX(calc(-33.333333% + ${mobileTrackOffsetX}px))`,
                    transition: isMobileTrackTransitionEnabled
                      ? "transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1)"
                      : "none",
                  } as CSSProperties
                }
              >
                <div className={styles.mobilePortfolioSlide}>
                  <div className={styles.mobilePortfolioMedia}>
                    <Image
                      src={prevMobilePhoto}
                      alt={`${activeMobileBride.name} — фото ${Math.max(mobilePhotoIndex, 1)}`}
                      fill
                      sizes="100vw"
                      className={styles.mobilePortfolioImage}
                      loading="lazy"
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
                      loading="lazy"
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
              </div>

              <div className={styles.mobilePortfolioControls}>
                <button
                  type="button"
                  className={styles.mobileCloseButton}
                  onClick={onClose}
                  onTouchStart={handleCloseTouchStart}
                  onTouchMove={handleCloseTouchMove}
                  onTouchEnd={handleCloseTouchEnd}
                  aria-label="Закрыть просмотр"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.7 5.3a1 1 0 0 1 1.4 0L12 9.2l3.9-3.9a1 1 0 1 1 1.4 1.4L13.4 10.6l3.9 3.9a1 1 0 1 1-1.4 1.4L12 12l-3.9 3.9a1 1 0 1 1-1.4-1.4l3.9-3.9-3.9-3.9a1 1 0 0 1 0-1.4Z" />
                  </svg>
                </button>

                <div className={styles.mobilePhotoNav}>
                  <button
                    type="button"
                    className={styles.mobilePhotoNavButton}
                    onClick={onPrevPhoto}
                    aria-label="Предыдущее фото"
                    disabled={!canPrevPhoto}
                  >
                    <span
                      className={`${styles.mobilePhotoNavHint} ${styles.mobilePhotoNavHintLeft}`}
                    >
                      <span className={styles.mobilePhotoNavChevron} />
                      <span className={styles.mobilePhotoNavChevron} />
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.mobilePhotoNavButton}
                    onClick={onNextPhoto}
                    aria-label="Следующее фото"
                    disabled={!canNextPhoto}
                  >
                    <span className={styles.mobilePhotoNavHint}>
                      <span className={styles.mobilePhotoNavChevron} />
                      <span className={styles.mobilePhotoNavChevron} />
                    </span>
                  </button>
                </div>
              </div>

              <div className={styles.mobileScrollDownHint} aria-hidden="true">
                <span className={styles.mobileDownChevron} />
                <span className={styles.mobileDownChevron} />
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
                      loading="lazy"
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
  );
}
