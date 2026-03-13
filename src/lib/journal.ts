import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_JOURNAL_POSTS } from "../components/screens/Journal/posts/defaultPosts";
import type { JournalPost } from "../components/screens/Journal/posts/types";

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

async function readJson(filePath: string): Promise<unknown | null> {
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getJournalPostsFromPublic(): Promise<JournalPost[]> {
  const postsRoot = path.join(process.cwd(), "public", "journal", "posts");
  const orderRaw = await readJson(path.join(postsRoot, "order.json"));

  if (!Array.isArray(orderRaw)) {
    return DEFAULT_JOURNAL_POSTS;
  }

  const ids = orderRaw.filter(
    (value): value is string => typeof value === "string",
  );

  if (ids.length === 0) {
    return DEFAULT_JOURNAL_POSTS;
  }

  const posts: JournalPost[] = [];

  for (const id of ids) {
    const postRaw = await readJson(path.join(postsRoot, id, "post.json"));

    if (isValidPost(postRaw)) {
      posts.push(postRaw);
    }
  }

  return posts.length > 0 ? posts : DEFAULT_JOURNAL_POSTS;
}
