import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_FAQ_ITEMS } from "../components/screens/Faq/defaultFaq";
import type { FaqItem } from "../components/screens/Faq/types";

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

async function readJson(filePath: string): Promise<unknown | null> {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getFaqItemsFromPublic(): Promise<FaqItem[]> {
  const faqFilePath = path.join(
    process.cwd(),
    "public",
    "faq",
    "questions.json",
  );
  const raw = await readJson(faqFilePath);

  if (!Array.isArray(raw)) {
    return DEFAULT_FAQ_ITEMS;
  }

  const valid = raw.filter(isValidFaqItem);
  return valid.length > 0 ? valid : DEFAULT_FAQ_ITEMS;
}
