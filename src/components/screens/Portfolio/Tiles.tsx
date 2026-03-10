import Image from "next/image";
import type { PortfolioBride } from "../../../lib/portfolio";
import styles from "./Tiles.module.css";

type TilesProps = {
  brides: PortfolioBride[];
  onSelect: (brideIndex: number) => void;
  isVisible: boolean;
  activeBrideIndex: number | null;
};

export default function Tiles({
  brides,
  onSelect,
  isVisible,
  activeBrideIndex,
}: TilesProps) {
  return (
    <section
      className={`${styles.tilesFeed} ${isVisible ? styles.tilesFeedVisible : styles.tilesFeedHidden}`}
      aria-label="Плитки портфолио"
      inert={!isVisible}
    >
      <ul className={styles.tilesGrid}>
        {brides.map((bride, brideIndex) => (
          <li key={bride.id}>
            <button
              type="button"
              className={`${styles.tileButton} ${activeBrideIndex === brideIndex ? styles.tileButtonActive : ""}`}
              onClick={() => onSelect(brideIndex)}
              aria-label={`Открыть невесту: ${bride.name}`}
            >
              <Image
                src={bride.photos[0]}
                alt={`${bride.name} — превью`}
                fill
                sizes="(max-width: 900px) 33vw"
                className={styles.tileImage}
              />
              <p className={styles.tileName}>{bride.name}</p>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
