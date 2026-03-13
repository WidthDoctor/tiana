import { DEFAULT_ACCESSORY_CATEGORIES } from "./defaultAccessories";
import type { AccessoryCategory } from "./types";

export const ACCESSORIES_STORAGE_KEY = "tiana:accessories-categories";

function isValidAccessoryItem(
  item: unknown,
): item is AccessoryCategory["items"][number] {
  if (!item || typeof item !== "object") {
    return false;
  }

  const candidate = item as AccessoryCategory["items"][number];

  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.price === "string" &&
    Array.isArray(candidate.images) &&
    candidate.images.every((image) => typeof image === "string")
  );
}

function isValidCategory(category: unknown): category is AccessoryCategory {
  if (!category || typeof category !== "object") {
    return false;
  }

  const candidate = category as AccessoryCategory;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.cover === "string" &&
    Array.isArray(candidate.items) &&
    candidate.items.every(isValidAccessoryItem)
  );
}

export function loadAccessoryCategories(): AccessoryCategory[] {
  if (typeof window === "undefined") {
    return DEFAULT_ACCESSORY_CATEGORIES;
  }

  try {
    const raw = window.localStorage.getItem(ACCESSORIES_STORAGE_KEY);

    if (!raw) {
      return DEFAULT_ACCESSORY_CATEGORIES;
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return DEFAULT_ACCESSORY_CATEGORIES;
    }

    const valid = parsed.filter(isValidCategory);
    return valid.length > 0 ? valid : DEFAULT_ACCESSORY_CATEGORIES;
  } catch {
    return DEFAULT_ACCESSORY_CATEGORIES;
  }
}

export function saveAccessoryCategories(categories: AccessoryCategory[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      ACCESSORIES_STORAGE_KEY,
      JSON.stringify(categories),
    );
    window.dispatchEvent(new CustomEvent("tiana:accessories-updated"));
    return;
  } catch {
    const compact = categories.map((category) => ({
      ...category,
      cover: category.cover.startsWith("data:image/") ? "" : category.cover,
      items: category.items.map((item) => ({
        ...item,
        images: item.images.filter((image) => !image.startsWith("data:image/")),
      })),
    }));

    try {
      window.localStorage.setItem(
        ACCESSORIES_STORAGE_KEY,
        JSON.stringify(compact),
      );
      window.dispatchEvent(new CustomEvent("tiana:accessories-updated"));
    } catch {
      // ignore to prevent editor crash on storage quota errors
    }
  }
}

export function resetAccessoryCategories(): void {
  saveAccessoryCategories(DEFAULT_ACCESSORY_CATEGORIES);
}
