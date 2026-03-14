import { DEFAULT_FAQ_ITEMS } from "./defaultFaq";
import type { FaqItem } from "./types";

export const FAQ_STORAGE_KEY = "tiana:faq-items";

function isValidFaqItem(item: unknown): item is FaqItem {
  if (!item || typeof item !== "object") {
    return false;
  }

  const candidate = item as FaqItem;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.question === "string" &&
    typeof candidate.answer === "string"
  );
}

export function loadFaqItems(): FaqItem[] {
  if (typeof window === "undefined") {
    return DEFAULT_FAQ_ITEMS;
  }

  try {
    const raw = window.localStorage.getItem(FAQ_STORAGE_KEY);

    if (!raw) {
      return DEFAULT_FAQ_ITEMS;
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return DEFAULT_FAQ_ITEMS;
    }

    const valid = parsed.filter(isValidFaqItem);
    return valid.length > 0 ? valid : DEFAULT_FAQ_ITEMS;
  } catch {
    return DEFAULT_FAQ_ITEMS;
  }
}

export function saveFaqItems(items: FaqItem[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(FAQ_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("tiana:faq-updated"));
}

export function resetFaqItems(): void {
  saveFaqItems(DEFAULT_FAQ_ITEMS);
}
