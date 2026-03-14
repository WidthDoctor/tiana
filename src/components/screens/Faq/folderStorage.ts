import type { FaqItem } from "./types";

type WritableLike = {
  write: (data: string | Uint8Array) => Promise<void>;
  close: () => Promise<void>;
};

type FileHandleLike = {
  createWritable: () => Promise<WritableLike>;
};

export type FaqDirectoryHandle = {
  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<FileHandleLike>;
  kind?: "directory";
  name?: string;
};

function safeId(input: string, fallback: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-я0-9-\s_]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/_+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || fallback;
}

async function writeJsonFile(fileHandle: FileHandleLike, payload: unknown) {
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(payload, null, 2));
  await writable.close();
}

export async function syncFaqToDirectory(
  faqDirHandle: FaqDirectoryHandle,
  items: FaqItem[],
): Promise<FaqItem[]> {
  const normalized = items.map((item, index) => ({
    id: safeId(item.id, `faq-${index + 1}`),
    question: item.question.trim() || `Вопрос ${index + 1}`,
    answer: item.answer.trim() || "Ответ",
  }));

  const fileHandle = await faqDirHandle.getFileHandle("questions.json", {
    create: true,
  });

  await writeJsonFile(fileHandle, normalized);
  return normalized;
}
