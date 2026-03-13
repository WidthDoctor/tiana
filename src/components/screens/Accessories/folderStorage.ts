import type { AccessoryCategory } from "./types";

type WritableLike = {
  write: (data: string | Uint8Array) => Promise<void>;
  close: () => Promise<void>;
};

type FileLike = {
  text: () => Promise<string>;
};

type FileHandleLike = {
  createWritable: () => Promise<WritableLike>;
  getFile: () => Promise<FileLike>;
  kind?: "file";
};

export type AccessoriesDirectoryHandle = {
  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<FileHandleLike>;
  getDirectoryHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<AccessoriesDirectoryHandle>;
  entries?: () => AsyncIterable<[string, { kind?: "file" | "directory" }]>;
  removeEntry?: (
    name: string,
    options?: { recursive?: boolean },
  ) => Promise<void>;
  kind?: "directory";
  name?: string;
};

function safeFolderId(input: string, fallback: string): string {
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

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function extensionFromDataUrl(dataUrl: string): string {
  const mime = dataUrl.match(/^data:(.*?);base64,/)?.[1] ?? "image/jpeg";

  if (mime.includes("png")) {
    return "png";
  }

  if (mime.includes("webp")) {
    return "webp";
  }

  return "jpg";
}

async function writeJsonFile(fileHandle: FileHandleLike, payload: unknown) {
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(payload, null, 2));
  await writable.close();
}

export async function syncAccessoryCategoriesToDirectory(
  accessoriesDirHandle: AccessoriesDirectoryHandle,
  categories: AccessoryCategory[],
): Promise<AccessoryCategory[]> {
  const normalizedCategories = categories.map((category, categoryIndex) => ({
    ...category,
    id: safeFolderId(category.id, `category-${categoryIndex + 1}`),
    title: category.title.trim() || `Раздел ${categoryIndex + 1}`,
    description: category.description.trim() || "Описание раздела",
    items:
      category.items.length > 0
        ? category.items.map((item, itemIndex) => ({
            ...item,
            id: safeFolderId(item.id, `item-${itemIndex + 1}`),
            title: item.title.trim() || `Товар ${itemIndex + 1}`,
            price: item.price.trim() || "0 BYN",
            images: item.images
              .map((image) => image.trim())
              .filter((image) => Boolean(image)),
          }))
        : [
            {
              id: "item-1",
              title: "Товар 1",
              price: "0 BYN",
              images: [],
            },
          ],
  }));

  const expectedCategoryIds = new Set(
    normalizedCategories.map((category) => category.id),
  );

  if (
    typeof accessoriesDirHandle.entries === "function" &&
    accessoriesDirHandle.removeEntry
  ) {
    for await (const [
      entryName,
      entryHandle,
    ] of accessoriesDirHandle.entries()) {
      if (entryName === "order.json") {
        continue;
      }

      if (
        entryHandle.kind === "directory" &&
        !expectedCategoryIds.has(entryName)
      ) {
        await accessoriesDirHandle.removeEntry(entryName, { recursive: true });
      }
    }
  }

  for (const category of normalizedCategories) {
    const categoryDir = await accessoriesDirHandle.getDirectoryHandle(
      category.id,
      {
        create: true,
      },
    );

    let cover = category.cover;

    if (category.cover.startsWith("data:image/")) {
      const ext = extensionFromDataUrl(category.cover);
      const coverFileName = `cover.${ext}`;
      const coverHandle = await categoryDir.getFileHandle(coverFileName, {
        create: true,
      });
      const coverWritable = await coverHandle.createWritable();
      await coverWritable.write(dataUrlToBytes(category.cover));
      await coverWritable.close();
      cover = `/accessories/${category.id}/${coverFileName}`;
    }

    const itemsRootDir = await categoryDir.getDirectoryHandle("items", {
      create: true,
    });

    const expectedItemIds = new Set(category.items.map((item) => item.id));

    if (
      typeof itemsRootDir.entries === "function" &&
      itemsRootDir.removeEntry
    ) {
      for await (const [entryName, entryHandle] of itemsRootDir.entries()) {
        if (entryName === "order.json") {
          continue;
        }

        if (
          entryHandle.kind === "directory" &&
          !expectedItemIds.has(entryName)
        ) {
          await itemsRootDir.removeEntry(entryName, { recursive: true });
        }
      }
    }

    const syncedItems: AccessoryCategory["items"] = [];

    for (const item of category.items) {
      const itemDir = await itemsRootDir.getDirectoryHandle(item.id, {
        create: true,
      });

      const images = [...item.images];

      for (let imageIndex = 0; imageIndex < images.length; imageIndex += 1) {
        const image = images[imageIndex];

        if (!image?.startsWith("data:image/")) {
          continue;
        }

        const ext = extensionFromDataUrl(image);
        const imageName = `image-${imageIndex + 1}.${ext}`;
        const imageFileHandle = await itemDir.getFileHandle(imageName, {
          create: true,
        });
        const imageWritable = await imageFileHandle.createWritable();
        await imageWritable.write(dataUrlToBytes(image));
        await imageWritable.close();

        images[imageIndex] =
          `/accessories/${category.id}/items/${item.id}/${imageName}`;
      }

      const itemPayload = {
        id: item.id,
        title: item.title,
        price: item.price,
        images,
      };

      const itemFile = await itemDir.getFileHandle("item.json", {
        create: true,
      });
      await writeJsonFile(itemFile, itemPayload);

      syncedItems.push(itemPayload);
    }

    const itemsOrderFile = await itemsRootDir.getFileHandle("order.json", {
      create: true,
    });
    await writeJsonFile(
      itemsOrderFile,
      syncedItems.map((item) => item.id),
    );

    const categoryFile = await categoryDir.getFileHandle("category.json", {
      create: true,
    });
    await writeJsonFile(categoryFile, {
      id: category.id,
      title: category.title,
      description: category.description,
      cover,
    });

    category.cover = cover;
    category.items = syncedItems;
  }

  const orderFileHandle = await accessoriesDirHandle.getFileHandle(
    "order.json",
    {
      create: true,
    },
  );
  await writeJsonFile(
    orderFileHandle,
    normalizedCategories.map((category) => category.id),
  );

  return normalizedCategories;
}
