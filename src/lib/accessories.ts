import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_ACCESSORY_CATEGORIES } from "../components/screens/Accessories/defaultAccessories";
import type { AccessoryCategory } from "../components/screens/Accessories/types";

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

async function readJson(filePath: string): Promise<unknown | null> {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getAccessoryCategoriesFromPublic(): Promise<
  AccessoryCategory[]
> {
  const accessoriesRoot = path.join(process.cwd(), "public", "accessories");
  const orderRaw = await readJson(path.join(accessoriesRoot, "order.json"));

  if (!Array.isArray(orderRaw)) {
    return DEFAULT_ACCESSORY_CATEGORIES;
  }

  const categoryIds = orderRaw.filter(
    (value): value is string => typeof value === "string",
  );

  if (categoryIds.length === 0) {
    return DEFAULT_ACCESSORY_CATEGORIES;
  }

  const categories: AccessoryCategory[] = [];

  for (const categoryId of categoryIds) {
    const categoryRaw = await readJson(
      path.join(accessoriesRoot, categoryId, "category.json"),
    );

    if (!categoryRaw || typeof categoryRaw !== "object") {
      continue;
    }

    const categoryMeta = categoryRaw as {
      id?: unknown;
      title?: unknown;
      description?: unknown;
      cover?: unknown;
    };

    if (
      typeof categoryMeta.id !== "string" ||
      typeof categoryMeta.title !== "string" ||
      typeof categoryMeta.description !== "string" ||
      typeof categoryMeta.cover !== "string"
    ) {
      continue;
    }

    const itemOrderRaw = await readJson(
      path.join(accessoriesRoot, categoryId, "items", "order.json"),
    );

    const itemIds = Array.isArray(itemOrderRaw)
      ? itemOrderRaw.filter(
          (value): value is string => typeof value === "string",
        )
      : [];

    const items: AccessoryCategory["items"] = [];

    for (const itemId of itemIds) {
      const itemRaw = await readJson(
        path.join(accessoriesRoot, categoryId, "items", itemId, "item.json"),
      );

      if (isValidAccessoryItem(itemRaw)) {
        items.push(itemRaw);
      }
    }

    categories.push({
      id: categoryMeta.id,
      title: categoryMeta.title,
      description: categoryMeta.description,
      cover: categoryMeta.cover,
      items,
    });
  }

  return categories.length > 0 ? categories : DEFAULT_ACCESSORY_CATEGORIES;
}
