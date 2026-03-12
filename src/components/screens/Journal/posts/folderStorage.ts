import type { JournalPost } from "./types";

export type PostsDirectoryHandle = {
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<any>;
  getDirectoryHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<any>;
  entries?: () => AsyncIterable<[string, any]>;
  removeEntry?: (
    name: string,
    options?: { recursive?: boolean },
  ) => Promise<void>;
  kind?: string;
  name?: string;
};

function getBasePath(): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
}

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

function isValidPost(post: unknown): post is JournalPost {
  if (!post || typeof post !== "object") {
    return false;
  }

  const candidate = post as JournalPost;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.excerpt === "string" &&
    typeof candidate.cover === "string" &&
    (candidate.images === undefined ||
      (Array.isArray(candidate.images) &&
        candidate.images.every((image) => typeof image === "string"))) &&
    Array.isArray(candidate.sections) &&
    candidate.sections.every(
      (section) =>
        section &&
        typeof section.heading === "string" &&
        typeof section.text === "string",
    )
  );
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

async function writeJsonFile(fileHandle: any, payload: unknown) {
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(payload, null, 2));
  await writable.close();
}

async function readJsonFile(fileHandle: any) {
  const file = await fileHandle.getFile();
  const text = await file.text();
  return JSON.parse(text);
}

export async function loadPostsFromPublicFolders(): Promise<JournalPost[]> {
  const basePath = getBasePath();
  const postsRoot = `${basePath}/journal/posts`;

  const orderResponse = await fetch(`${postsRoot}/order.json`, {
    cache: "no-store",
  });

  if (!orderResponse.ok) {
    return [];
  }

  const order = await orderResponse.json();

  if (!Array.isArray(order)) {
    return [];
  }

  const posts = await Promise.all(
    order.map(async (id) => {
      if (typeof id !== "string") {
        return null;
      }

      const response = await fetch(`${postsRoot}/${id}/post.json`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return null;
      }

      const post = await response.json();
      return isValidPost(post) ? post : null;
    }),
  );

  return posts.filter((post): post is JournalPost => Boolean(post));
}

export async function loadPostsFromDirectory(
  postsDirHandle: PostsDirectoryHandle,
): Promise<JournalPost[]> {
  const orderFileHandle = await postsDirHandle.getFileHandle("order.json", {
    create: true,
  });
  const orderRaw = await readJsonFile(orderFileHandle).catch(() => []);
  const order = Array.isArray(orderRaw)
    ? orderRaw.filter((item): item is string => typeof item === "string")
    : [];

  const posts = await Promise.all(
    order.map(async (id) => {
      try {
        const postDir = await postsDirHandle.getDirectoryHandle(id);
        const postFile = await postDir.getFileHandle("post.json");
        const post = await readJsonFile(postFile);
        return isValidPost(post) ? post : null;
      } catch {
        return null;
      }
    }),
  );

  return posts.filter((post): post is JournalPost => Boolean(post));
}

export async function syncPostsToDirectory(
  postsDirHandle: PostsDirectoryHandle,
  posts: JournalPost[],
): Promise<JournalPost[]> {
  const normalizedPosts = posts.map((post, index) => ({
    ...post,
    id: safeFolderId(post.id, `post-${index + 1}`),
    title: post.title.trim() || `Пост ${index + 1}`,
    excerpt: post.excerpt.length > 0 ? post.excerpt : "Краткое описание",
    images: Array.isArray(post.images)
      ? post.images.filter((image) => typeof image === "string" && image.trim())
      : [],
    sections:
      post.sections.length > 0
        ? post.sections.map((section) => ({
            heading: section.heading.trim() || "Раздел",
            text: section.text,
          }))
        : [{ heading: "Раздел", text: "" }],
  }));

  const expectedIds = new Set(normalizedPosts.map((post) => post.id));

  if (
    typeof postsDirHandle.entries === "function" &&
    postsDirHandle.removeEntry
  ) {
    for await (const [entryName, entryHandle] of postsDirHandle.entries()) {
      if (entryName === "order.json") {
        continue;
      }

      if (entryHandle.kind === "directory" && !expectedIds.has(entryName)) {
        await postsDirHandle.removeEntry(entryName, { recursive: true });
      }
    }
  }

  for (const post of normalizedPosts) {
    const postDir = await postsDirHandle.getDirectoryHandle(post.id, {
      create: true,
    });

    let cover = post.cover;
    const images = [...(post.images ?? [])];

    if (post.cover.startsWith("data:image/")) {
      const ext = extensionFromDataUrl(post.cover);
      const imageName = `cover.${ext}`;
      const imageFileHandle = await postDir.getFileHandle(imageName, {
        create: true,
      });
      const imageWritable = await imageFileHandle.createWritable();
      await imageWritable.write(dataUrlToBytes(post.cover));
      await imageWritable.close();
      cover = `/journal/posts/${post.id}/${imageName}`;
    }

    for (let index = 0; index < images.length; index += 1) {
      const image = images[index];

      if (!image?.startsWith("data:image/")) {
        continue;
      }

      const ext = extensionFromDataUrl(image);
      const imageName = `image-${index + 1}.${ext}`;
      const imageFileHandle = await postDir.getFileHandle(imageName, {
        create: true,
      });
      const imageWritable = await imageFileHandle.createWritable();
      await imageWritable.write(dataUrlToBytes(image));
      await imageWritable.close();
      images[index] = `/journal/posts/${post.id}/${imageName}`;
    }

    const postFileHandle = await postDir.getFileHandle("post.json", {
      create: true,
    });

    await writeJsonFile(postFileHandle, {
      ...post,
      cover,
      images,
    });
  }

  const orderFileHandle = await postsDirHandle.getFileHandle("order.json", {
    create: true,
  });
  await writeJsonFile(
    orderFileHandle,
    normalizedPosts.map((post) => post.id),
  );

  return normalizedPosts;
}
