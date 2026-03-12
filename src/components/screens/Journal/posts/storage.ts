import { DEFAULT_JOURNAL_POSTS } from "./defaultPosts";
import type { JournalPost } from "./types";

export const JOURNAL_POSTS_STORAGE_KEY = "tiana:journal-posts";

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

export function loadJournalPosts(): JournalPost[] {
  if (typeof window === "undefined") {
    return DEFAULT_JOURNAL_POSTS;
  }

  try {
    const raw = window.localStorage.getItem(JOURNAL_POSTS_STORAGE_KEY);

    if (!raw) {
      return DEFAULT_JOURNAL_POSTS;
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return DEFAULT_JOURNAL_POSTS;
    }

    const validPosts = parsed.filter(isValidPost);

    return validPosts.length > 0 ? validPosts : DEFAULT_JOURNAL_POSTS;
  } catch {
    return DEFAULT_JOURNAL_POSTS;
  }
}

export function saveJournalPosts(posts: JournalPost[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(JOURNAL_POSTS_STORAGE_KEY, JSON.stringify(posts));
  window.dispatchEvent(new CustomEvent("tiana:journal-posts-updated"));
}

export function resetJournalPosts(): void {
  saveJournalPosts(DEFAULT_JOURNAL_POSTS);
}
