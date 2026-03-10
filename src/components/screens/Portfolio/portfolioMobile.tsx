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
}: PortfolioMobileProps) {
  return (
    <section
      className={styles.mobilePortfolioFeed}
      aria-label="Мобильная галерея"
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
              </div>

              <div className={styles.mobilePortfolioControls}>
                {canPrevPhoto ? (
                  <button
                    type="button"
                    className={`${styles.mobileArrow} ${styles.mobileArrowLeft}`}
                    onClick={onPrevPhoto}
                    aria-label="Предыдущее фото"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M14.7 5.3a1 1 0 0 1 0 1.4L9.4 12l5.3 5.3a1 1 0 0 1-1.4 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.4 0Z" />
                    </svg>
                  </button>
                ) : null}

                {canNextPhoto ? (
                  <button
                    type="button"
                    className={`${styles.mobileArrow} ${styles.mobileArrowRight}`}
                    onClick={onNextPhoto}
                    aria-label="Следующее фото"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9.3 5.3a1 1 0 0 1 1.4 0l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4-1.4l5.3-5.3-5.3-5.3a1 1 0 0 1 0-1.4Z" />
                    </svg>
                  </button>
                ) : null}
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
  );
}
