'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './Slider.module.css';

const SWIPE_THRESHOLD = 50;

function getSlidePosition(index, activeIndex, total) {
  if (total === 0) {
    return 'hidden';
  }

  const forwardDistance = (index - activeIndex + total) % total;
  const backwardDistance = (activeIndex - index + total) % total;

  if (forwardDistance === 0) {
    return 'center';
  }

  if (total > 1 && forwardDistance === 1) {
    return 'right';
  }

  if (total > 1 && backwardDistance === 1) {
    return 'left';
  }

  if (total > 2 && forwardDistance === 2) {
    return 'farRight';
  }

  if (total > 2 && backwardDistance === 2) {
    return 'farLeft';
  }

  return 'hidden';
}

export default function SliderClient({ images }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
  const pointerStartX = useRef(0);
  const pointerDeltaX = useRef(0);
  const isPointerDown = useRef(false);
  const resumeTimeoutRef = useRef(null);

  const preparedImages = useMemo(() => images ?? [], [images]);

  const pauseAutoPlayAfterManualAction = () => {
    if (resumeTimeoutRef.current) {
      window.clearTimeout(resumeTimeoutRef.current);
    }

    setIsAutoPlayPaused(true);

    resumeTimeoutRef.current = window.setTimeout(() => {
      setIsAutoPlayPaused(false);
      resumeTimeoutRef.current = null;
    }, 5000);
  };

  const goNext = (isManual = true) => {
    if (preparedImages.length < 2) {
      return;
    }

    if (isManual) {
      pauseAutoPlayAfterManualAction();
    }

    setActiveIndex((prev) => (prev + 1) % preparedImages.length);
  };

  const goPrev = (isManual = true) => {
    if (preparedImages.length < 2) {
      return;
    }

    if (isManual) {
      pauseAutoPlayAfterManualAction();
    }

    setActiveIndex((prev) => (prev - 1 + preparedImages.length) % preparedImages.length);
  };

  useEffect(() => {
    if (preparedImages.length < 2 || isDragging || isAutoPlayPaused) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % preparedImages.length);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [preparedImages.length, isDragging, isAutoPlayPaused]);

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        window.clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, []);

  if (preparedImages.length === 0) {
    return (
      <section className={styles.slider} aria-label="Слайдер с фотографиями">
        <div className={styles.emptyState}>В папке homeSlider пока нет изображений</div>
      </section>
    );
  }

  const resetPointerState = () => {
    isPointerDown.current = false;
    pointerDeltaX.current = 0;
    setIsDragging(false);
  };

  const handlePointerDown = (event) => {
    if (preparedImages.length < 2) {
      return;
    }

    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    if (event.target.closest('button')) {
      return;
    }

    isPointerDown.current = true;
    pointerStartX.current = event.clientX;
    pointerDeltaX.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!isPointerDown.current) {
      return;
    }

    pointerDeltaX.current = event.clientX - pointerStartX.current;

    if (!isDragging && Math.abs(pointerDeltaX.current) > 4) {
      setIsDragging(true);
    }
  };

  const handlePointerUp = (event) => {
    if (!isPointerDown.current) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);

    if (Math.abs(pointerDeltaX.current) >= SWIPE_THRESHOLD) {
      if (pointerDeltaX.current < 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    resetPointerState();
  };

  const handlePointerCancel = (event) => {
    if (!isPointerDown.current) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    resetPointerState();
  };

  return (
    <section className={styles.slider} aria-label="Слайдер с фотографиями">
      <div
        className={`${styles.viewport} ${isDragging ? styles.dragging : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <button
          type="button"
          className={`${styles.sideZone} ${styles.sideZoneLeft}`}
          onClick={goPrev}
          aria-label="Листать влево"
        />
        <button
          type="button"
          className={`${styles.sideZone} ${styles.sideZoneRight}`}
          onClick={goNext}
          aria-label="Листать вправо"
        />

        <ul className={styles.track}>
          {preparedImages.map((image, index) => {
            const position = getSlidePosition(index, activeIndex, preparedImages.length);
            const isActive = index === activeIndex;

            return (
              <li key={image.src} className={`${styles.slide} ${styles[position]}`} aria-hidden={position === 'hidden'}>
                <Image
                  src={image.src}
                  alt={image.alt || 'Фото слайдера'}
                  fill
                  sizes="(max-width: 768px) 92vw, (max-width: 1200px) 58vw, 696px"
                  className={styles.image}
                  quality={80}
                  loading={isActive ? 'eager' : 'lazy'}
                  fetchPriority={isActive ? 'high' : 'auto'}
                  decoding="async"
                  priority={isActive && activeIndex === 0}
                  draggable={false}
                />
              </li>
            );
          })}
        </ul>

        <button type="button" className={`${styles.arrow} ${styles.prev}`} onClick={goPrev} aria-label="Предыдущий слайд">
          <span className={styles.arrowIcon}>⌵</span>
        </button>
        <button type="button" className={`${styles.arrow} ${styles.next}`} onClick={goNext} aria-label="Следующий слайд">
          <span className={styles.arrowIcon}>⌵</span>
        </button>
      </div>
    </section>
  );
}
