import { readdir } from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";

const PORTFOLIO_ROOT = path.join(
  process.cwd(),
  "public",
  "images",
  "portfolio",
);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function withBasePath(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  const normalizedSrc = src.startsWith("/") ? src : `/${src}`;

  if (BASE_PATH && normalizedSrc.startsWith(`${BASE_PATH}/`)) {
    return normalizedSrc;
  }

  return `${BASE_PATH}${normalizedSrc}`;
}

export interface PortfolioBride {
  id: string;
  name: string;
  photos: string[];
}

function toDisplayName(folderName: string): string {
  return folderName
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function getPortfolioBrides(): Promise<PortfolioBride[]> {
  let entries: Dirent<string>[];

  try {
    entries = await readdir(PORTFOLIO_ROOT, {
      withFileTypes: true,
      encoding: "utf8",
    });
  } catch {
    return [];
  }

  const brides = await Promise.all<PortfolioBride | null>(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (folder) => {
        const folderPath = path.join(PORTFOLIO_ROOT, folder.name);
        const files = await readdir(folderPath, {
          withFileTypes: true,
          encoding: "utf8",
        });

        const photos = Array.from(
          new Set(
            files
              .filter((file) => file.isFile())
              .map((file) => file.name)
              .filter((fileName) => {
                const extension = path.extname(fileName).toLowerCase();
                return IMAGE_EXTENSIONS.has(extension);
              })
              .sort((a, b) => a.localeCompare(b, "ru", { numeric: true }))
              .map((fileName) =>
                withBasePath(
                  `/images/portfolio/${encodeURIComponent(folder.name)}/${encodeURIComponent(fileName)}`,
                ),
              ),
          ),
        );

        if (photos.length === 0) {
          return null;
        }

        return {
          id: folder.name,
          name: toDisplayName(folder.name),
          photos,
        } satisfies PortfolioBride;
      }),
  );

  return brides
    .filter((item): item is PortfolioBride => item !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));
}
