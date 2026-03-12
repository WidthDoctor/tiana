"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRef } from "react";
import type { KeyboardEvent } from "react";
import styles from "./Editor.module.css";
import { DEFAULT_JOURNAL_POSTS } from "../posts/defaultPosts";
import {
  type PostsDirectoryHandle,
  syncPostsToDirectory,
} from "../posts/folderStorage";
import {
  loadJournalPosts,
  resetJournalPosts,
  saveJournalPosts,
} from "../posts/storage";
import type { JournalPost, JournalPostSection } from "../posts/types";

function createEmptyPost(): JournalPost {
  return {
    id: `post-${Date.now()}`,
    title: "Новый пост",
    excerpt: "Краткое описание поста",
    cover: "/images/homeSlider/1.png",
    images: [],
    sections: [
      {
        heading: "Новый раздел",
        text: "Текст раздела",
      },
    ],
  };
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-я0-9-\s_]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/_+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function toggleInlineMarker(
  value: string,
  start: number,
  end: number,
  marker: "**" | "*",
): { value: string; selectionStart: number; selectionEnd: number } {
  const selected = value.slice(start, end);
  const hasMarker =
    selected.startsWith(marker) &&
    selected.endsWith(marker) &&
    selected.length >= marker.length * 2;

  if (hasMarker) {
    const unwrapped = selected.slice(
      marker.length,
      selected.length - marker.length,
    );
    const nextValue = `${value.slice(0, start)}${unwrapped}${value.slice(end)}`;
    const nextStart = start;
    const nextEnd = start + unwrapped.length;
    return {
      value: nextValue,
      selectionStart: nextStart,
      selectionEnd: nextEnd,
    };
  }

  const wrapped = `${marker}${selected}${marker}`;
  const nextValue = `${value.slice(0, start)}${wrapped}${value.slice(end)}`;

  if (start === end) {
    const cursor = start + marker.length;
    return { value: nextValue, selectionStart: cursor, selectionEnd: cursor };
  }

  const nextStart = start + marker.length;
  const nextEnd = nextStart + selected.length;
  return { value: nextValue, selectionStart: nextStart, selectionEnd: nextEnd };
}

export default function Editor() {
  const [posts, setPosts] = useState<JournalPost[]>(() => loadJournalPosts());
  const [activePostId, setActivePostId] = useState<string>(
    () => loadJournalPosts()[0]?.id ?? "",
  );
  const [statusText, setStatusText] = useState("Готово к редактированию.");
  const [postsDirHandle, setPostsDirHandle] =
    useState<PostsDirectoryHandle | null>(null);
  const excerptTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sectionTextareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const activePostIndex = posts.findIndex((post) => post.id === activePostId);
  const activePost = activePostIndex >= 0 ? posts[activePostIndex] : undefined;

  const postCountLabel = useMemo(() => {
    if (posts.length === 1) {
      return "1 пост";
    }

    return `${posts.length} постов`;
  }, [posts.length]);

  const updatePost = (nextPost: JournalPost) => {
    if (!activePost) {
      return;
    }

    setPosts((previous) =>
      previous.map((post) => (post.id === activePost.id ? nextPost : post)),
    );
  };

  const handleCreatePost = () => {
    const newPost = createEmptyPost();
    setPosts((previous) => [...previous, newPost]);
    setActivePostId(newPost.id);
    setStatusText("Создан новый пост.");
  };

  const handleDeletePost = () => {
    if (!activePost) {
      return;
    }

    const nextPosts = posts.filter((post) => post.id !== activePost.id);
    setPosts(nextPosts);
    setActivePostId(nextPosts[0]?.id ?? "");
    setStatusText("Пост удален.");
  };

  const handleMovePost = (direction: "up" | "down") => {
    if (!activePost || activePostIndex < 0) {
      return;
    }

    if (direction === "up" && activePostIndex === 0) {
      return;
    }

    if (direction === "down" && activePostIndex === posts.length - 1) {
      return;
    }

    const targetIndex =
      direction === "up" ? activePostIndex - 1 : activePostIndex + 1;
    const nextPosts = moveItem(posts, activePostIndex, targetIndex);
    setPosts(nextPosts);
    setActivePostId(activePost.id);
    setStatusText("Порядок постов обновлен.");
  };

  const handleCoverUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file || !activePost) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";

      if (!result) {
        return;
      }

      updatePost({
        ...activePost,
        cover: result,
      });

      setStatusText("Обложка загружена.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleGalleryUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!activePost) {
      return;
    }

    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const fileToDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          const result = typeof reader.result === "string" ? reader.result : "";

          if (!result) {
            reject(new Error("empty result"));
            return;
          }

          resolve(result);
        };

        reader.onerror = () => reject(new Error("reader error"));
        reader.readAsDataURL(file);
      });

    try {
      const loaded = await Promise.all(files.map(fileToDataUrl));

      updatePost({
        ...activePost,
        images: [...(activePost.images ?? []), ...loaded],
      });

      setStatusText(`Добавлено изображений: ${loaded.length}.`);
    } catch {
      setStatusText("Не удалось загрузить одно или несколько изображений.");
    }

    event.target.value = "";
  };

  const handleImagePathChange = (imageIndex: number, value: string) => {
    if (!activePost) {
      return;
    }

    const nextImages = [...(activePost.images ?? [])];
    nextImages[imageIndex] = value;

    updatePost({
      ...activePost,
      images: nextImages,
    });
  };

  const handleDeleteImage = (imageIndex: number) => {
    if (!activePost) {
      return;
    }

    const nextImages = (activePost.images ?? []).filter(
      (_, index) => index !== imageIndex,
    );

    updatePost({
      ...activePost,
      images: nextImages,
    });

    setStatusText("Изображение удалено из поста.");
  };

  const handleSectionChange = (
    sectionIndex: number,
    key: keyof JournalPostSection,
    value: string,
  ) => {
    if (!activePost) {
      return;
    }

    const sections = activePost.sections.map((section, index) =>
      index === sectionIndex ? { ...section, [key]: value } : section,
    );

    updatePost({ ...activePost, sections });
  };

  const handleAddSection = () => {
    if (!activePost) {
      return;
    }

    updatePost({
      ...activePost,
      sections: [...activePost.sections, { heading: "Новый раздел", text: "" }],
    });
  };

  const handleDeleteSection = (sectionIndex: number) => {
    if (!activePost || activePost.sections.length <= 1) {
      return;
    }

    updatePost({
      ...activePost,
      sections: activePost.sections.filter(
        (_, index) => index !== sectionIndex,
      ),
    });
  };

  const applyExcerptFormat = (marker: "**" | "*") => {
    if (!activePost || !excerptTextareaRef.current) {
      return;
    }

    const textarea = excerptTextareaRef.current;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? start;
    const result = toggleInlineMarker(activePost.excerpt, start, end, marker);

    updatePost({
      ...activePost,
      excerpt: result.value,
    });

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const applySectionFormat = (sectionIndex: number, marker: "**" | "*") => {
    if (!activePost) {
      return;
    }

    const textarea = sectionTextareaRefs.current[sectionIndex];

    if (!textarea) {
      return;
    }

    const currentText = activePost.sections[sectionIndex]?.text ?? "";
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? start;
    const result = toggleInlineMarker(currentText, start, end, marker);

    const sections = activePost.sections.map((section, index) =>
      index === sectionIndex ? { ...section, text: result.value } : section,
    );

    updatePost({
      ...activePost,
      sections,
    });

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const handleTextFormattingHotkeys = (
    event: KeyboardEvent<HTMLTextAreaElement>,
    onBold: () => void,
    onItalic: () => void,
  ) => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === "b") {
      event.preventDefault();
      onBold();
      return;
    }

    if (key === "i") {
      event.preventDefault();
      onItalic();
    }
  };

  const getOrPickPostsDirHandle = async () => {
    if (postsDirHandle) {
      return postsDirHandle;
    }

    const picker = (
      window as unknown as {
        showDirectoryPicker?: () => Promise<PostsDirectoryHandle>;
      }
    ).showDirectoryPicker;

    if (!picker) {
      return null;
    }

    const picked = await picker();
    let postsHandle: PostsDirectoryHandle = picked;

    if (picked.name !== "posts") {
      const journalHandle = await picked.getDirectoryHandle("journal", {
        create: true,
      });
      postsHandle = await journalHandle.getDirectoryHandle("posts", {
        create: true,
      });
    }

    setPostsDirHandle(postsHandle);
    return postsHandle;
  };

  const handleSave = async () => {
    const normalized = posts.map((post, index) => {
      const safeId = slugify(post.id) || `post-${index + 1}`;

      return {
        ...post,
        id: safeId,
        title: post.title.trim() || `Пост ${index + 1}`,
        excerpt: post.excerpt.length > 0 ? post.excerpt : "Краткое описание",
        images: Array.isArray(post.images)
          ? post.images
              .map((image) => image.trim())
              .filter((image) => Boolean(image))
          : [],
        sections:
          post.sections.length > 0
            ? post.sections.map((section) => ({
                heading: section.heading.trim() || "Раздел",
                text: section.text,
              }))
            : [{ heading: "Раздел", text: "" }],
      };
    });

    saveJournalPosts(normalized);
    setPosts(normalized);
    setActivePostId((current) =>
      normalized.some((post) => post.id === current)
        ? current
        : (normalized[0]?.id ?? ""),
    );

    try {
      const postsHandle = await getOrPickPostsDirHandle();

      if (!postsHandle) {
        setStatusText(
          "Сохранено локально. Для создания папок используйте Chrome/Edge и File System Access.",
        );
        return;
      }

      const syncedPosts = await syncPostsToDirectory(postsHandle, normalized);
      setPosts(syncedPosts);
      saveJournalPosts(syncedPosts);
      setStatusText(
        "Сохранено: папки постов в journal/posts созданы и обновлены.",
      );

      setActivePostId((current) =>
        syncedPosts.some((post) => post.id === current)
          ? current
          : (syncedPosts[0]?.id ?? ""),
      );
    } catch {
      setStatusText("Сохранение отменено или не удалось записать папки posts.");
    }
  };

  const handleResetToDefault = () => {
    resetJournalPosts();
    setPosts(DEFAULT_JOURNAL_POSTS);
    setActivePostId(DEFAULT_JOURNAL_POSTS[0]?.id ?? "");
    setStatusText("Восстановлены базовые посты.");
  };

  return (
    <main className={styles.page}>
      <section className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={styles.title}>Editor · Journal</h1>
          <p className={styles.subtitle}>{postCountLabel}</p>
        </div>

        <div className={styles.list}>
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              className={`${styles.postItem} ${post.id === activePostId ? styles.postItemActive : ""}`}
              onClick={() => setActivePostId(post.id)}
            >
              <span className={styles.postItemTitle}>{post.title}</span>
              <span className={styles.postItemId}>{post.id}</span>
            </button>
          ))}
        </div>

        <div className={styles.sidebarActions}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleCreatePost}
          >
            Новый пост
          </button>
          <button
            type="button"
            className={styles.actionButton}
            onClick={handleSave}
          >
            Сохранить
          </button>
          <button
            type="button"
            className={styles.actionButtonGhost}
            onClick={handleResetToDefault}
          >
            Сбросить
          </button>
        </div>

        <p className={styles.status}>{statusText}</p>
        <p className={styles.hint}>
          Папка posts:{" "}
          {postsDirHandle ? "подключена" : "будет выбрана при сохранении"}
        </p>
      </section>

      <section className={styles.editorArea}>
        {activePost ? (
          <>
            <div className={styles.toolbar}>
              <button
                type="button"
                className={styles.toolbarButton}
                onClick={() => handleMovePost("up")}
                disabled={activePostIndex <= 0}
              >
                ↑ Выше
              </button>
              <button
                type="button"
                className={styles.toolbarButton}
                onClick={() => handleMovePost("down")}
                disabled={activePostIndex >= posts.length - 1}
              >
                ↓ Ниже
              </button>
              <button
                type="button"
                className={styles.toolbarDanger}
                onClick={handleDeletePost}
              >
                Удалить пост
              </button>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>ID (имя папки)</span>
                <input
                  value={activePost.id}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    setActivePostId(nextId);
                    updatePost({ ...activePost, id: nextId });
                  }}
                />
              </label>

              <label className={styles.field}>
                <span>Заголовок</span>
                <input
                  value={activePost.title}
                  onChange={(event) =>
                    updatePost({ ...activePost, title: event.target.value })
                  }
                />
              </label>

              <label className={styles.fieldFull}>
                <span>Краткий текст</span>
                <div className={styles.formatControls}>
                  <button
                    type="button"
                    className={styles.formatButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => applyExcerptFormat("**")}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    className={styles.formatButton}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => applyExcerptFormat("*")}
                  >
                    I
                  </button>
                </div>
                <textarea
                  rows={3}
                  ref={excerptTextareaRef}
                  value={activePost.excerpt}
                  onKeyDown={(event) =>
                    handleTextFormattingHotkeys(
                      event,
                      () => applyExcerptFormat("**"),
                      () => applyExcerptFormat("*"),
                    )
                  }
                  onChange={(event) =>
                    updatePost({ ...activePost, excerpt: event.target.value })
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Путь к обложке</span>
                <input
                  value={activePost.cover}
                  onChange={(event) =>
                    updatePost({ ...activePost, cover: event.target.value })
                  }
                />
              </label>

              <label className={styles.field}>
                <span>Загрузка обложки</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                />
              </label>

              <label className={styles.fieldFull}>
                <span>Галерея (несколько изображений)</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                />
              </label>
            </div>

            <div className={styles.coverPreview}>
              <Image
                src={activePost.cover}
                alt={activePost.title}
                fill
                sizes="420px"
                className={styles.coverImage}
                unoptimized={activePost.cover.startsWith("data:image/")}
              />
            </div>

            <div className={styles.sectionsWrap}>
              <div className={styles.galleryWrap}>
                <h2>Изображения поста</h2>

                {(activePost.images ?? []).length > 0 ? (
                  <div className={styles.galleryList}>
                    {(activePost.images ?? []).map((image, imageIndex) => (
                      <div
                        key={`${activePost.id}-image-${imageIndex}`}
                        className={styles.galleryItem}
                      >
                        <input
                          value={image}
                          onChange={(event) =>
                            handleImagePathChange(
                              imageIndex,
                              event.target.value,
                            )
                          }
                        />
                        <button
                          type="button"
                          className={styles.toolbarDanger}
                          onClick={() => handleDeleteImage(imageIndex)}
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.galleryEmpty}>
                    Пока нет дополнительных изображений.
                  </p>
                )}
              </div>

              <div className={styles.sectionsHeader}>
                <h2>Секции статьи</h2>
                <button
                  type="button"
                  className={styles.toolbarButton}
                  onClick={handleAddSection}
                >
                  Добавить секцию
                </button>
              </div>

              {activePost.sections.map((section, sectionIndex) => (
                <div
                  key={`${activePost.id}-${sectionIndex}`}
                  className={styles.sectionCard}
                >
                  <label className={styles.field}>
                    <span>Заголовок секции</span>
                    <input
                      value={section.heading}
                      onChange={(event) =>
                        handleSectionChange(
                          sectionIndex,
                          "heading",
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label className={styles.fieldFull}>
                    <span>Текст секции</span>
                    <div className={styles.formatControls}>
                      <button
                        type="button"
                        className={styles.formatButton}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => applySectionFormat(sectionIndex, "**")}
                      >
                        B
                      </button>
                      <button
                        type="button"
                        className={styles.formatButton}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => applySectionFormat(sectionIndex, "*")}
                      >
                        I
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      ref={(node) => {
                        sectionTextareaRefs.current[sectionIndex] = node;
                      }}
                      value={section.text}
                      onKeyDown={(event) =>
                        handleTextFormattingHotkeys(
                          event,
                          () => applySectionFormat(sectionIndex, "**"),
                          () => applySectionFormat(sectionIndex, "*"),
                        )
                      }
                      onChange={(event) =>
                        handleSectionChange(
                          sectionIndex,
                          "text",
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <button
                    type="button"
                    className={styles.toolbarDanger}
                    onClick={() => handleDeleteSection(sectionIndex)}
                    disabled={activePost.sections.length <= 1}
                  >
                    Удалить секцию
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className={styles.empty}>
            Создайте первый пост, чтобы начать редактирование.
          </p>
        )}
      </section>
    </main>
  );
}
