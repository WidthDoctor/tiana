"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent, TouchEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cormorantGaramond, erasLight } from "../../../app/fonts";
import styles from "../Home/NavbarMini.module.css";
import { MENU_CONTENT_ITEMS } from "./menuContentConfig";
import type { MenuContentItem } from "./menuContentConfig";
import SelectMobile from "./selectMobile";

const CONTENT_SWITCH_DURATION = 220;
const CONTENT_CLOSE_DURATION = 820;
const INITIAL_MENU_ID = MENU_CONTENT_ITEMS[0]?.id ?? "";
const SECTION_QUERY_PARAM = "section";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function withBasePath(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  const normalizedSrc = src.startsWith("/") ? src : `/${src}`;

  if (BASE_PATH && normalizedSrc.startsWith(`${BASE_PATH}/`)) {
    return normalizedSrc;
  }

  return `${BASE_PATH}${normalizedSrc}`;
}

export default function Select() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(INITIAL_MENU_ID);
  const [displayedMenuId, setDisplayedMenuId] = useState(INITIAL_MENU_ID);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [isContentOpen, setIsContentOpen] = useState(false);
  const [isContentClosing, setIsContentClosing] = useState(false);
  const [isContentSwitching, setIsContentSwitching] = useState(false);
  const [contentSwipeOffsetX, setContentSwipeOffsetX] = useState(0);
  const [contentSwipeViewportHeight, setContentSwipeViewportHeight] = useState<
    number | null
  >(null);
  const [isContentSwipeTransitionEnabled, setIsContentSwipeTransitionEnabled] =
    useState(false);
  const [isContentSwipeDragging, setIsContentSwipeDragging] = useState(false);
  const switchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openFrameRef = useRef<number | null>(null);
  const contentTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const contentTouchAxisRef = useRef<"x" | "y" | null>(null);
  const contentTouchWidthRef = useRef(0);
  const contentSwipeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const contentSwipeViewportRef = useRef<HTMLDivElement | null>(null);
  const selectorContainerRef = useRef<HTMLDivElement | null>(null);
  const swipePanelRefs = useRef<
    Partial<Record<MenuContentItem["id"], HTMLElement | null>>
  >({});
  const selectorItemRefs = useRef<
    Partial<Record<MenuContentItem["id"], HTMLAnchorElement | null>>
  >({});

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) {
        clearTimeout(switchTimeoutRef.current);
      }

      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }

      if (openFrameRef.current) {
        cancelAnimationFrame(openFrameRef.current);
      }

      if (contentSwipeTimeoutRef.current) {
        clearTimeout(contentSwipeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const activeNode = selectorItemRefs.current[activeMenuId];

    if (!activeNode) {
      return;
    }

    activeNode.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeMenuId]);

  useEffect(() => {
    if (!isOpen && !isContentVisible) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isContentVisible, isOpen]);

  const buildMenuHref = useCallback(
    (menuId: MenuContentItem["id"]) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set(SECTION_QUERY_PARAM, menuId);
      const query = nextParams.toString();

      return query ? `${pathname}?${query}` : pathname;
    },
    [pathname, searchParams],
  );

  useEffect(() => {
    const menuIdFromQuery = searchParams.get(SECTION_QUERY_PARAM);

    if (!menuIdFromQuery) {
      return;
    }

    const hasMenuItem = MENU_CONTENT_ITEMS.some(
      (item) => item.id === menuIdFromQuery,
    );

    if (!hasMenuItem) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setActiveMenuId((previous) =>
        previous === menuIdFromQuery ? previous : menuIdFromQuery,
      );
      setDisplayedMenuId((previous) =>
        previous === menuIdFromQuery ? previous : menuIdFromQuery,
      );
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [searchParams]);

  const openContent = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    if (openFrameRef.current) {
      cancelAnimationFrame(openFrameRef.current);
    }

    setIsContentVisible(true);
    setIsContentClosing(false);

    openFrameRef.current = requestAnimationFrame(() => {
      setIsContentOpen(true);
    });
  };

  const closeContentWithReverse = useCallback(() => {
    if (!isContentVisible || isContentClosing) {
      setIsOpen(false);
      return;
    }

    setIsOpen(false);
    setIsContentClosing(true);
    setIsContentOpen(false);
    setIsContentSwitching(false);

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = setTimeout(() => {
      setIsContentVisible(false);
      setIsContentClosing(false);
    }, CONTENT_CLOSE_DURATION);
  }, [isContentClosing, isContentVisible]);

  useEffect(() => {
    const handleExternalLogoClose = () => {
      closeContentWithReverse();
    };

    window.addEventListener(
      "tiana:logo-close-content",
      handleExternalLogoClose,
    );

    return () => {
      window.removeEventListener(
        "tiana:logo-close-content",
        handleExternalLogoClose,
      );
    };
  }, [closeContentWithReverse]);

  useEffect(() => {
    const handlePortfolioOpen = () => {
      closeContentWithReverse();
    };

    window.addEventListener("tiana:open-portfolio", handlePortfolioOpen);

    return () => {
      window.removeEventListener("tiana:open-portfolio", handlePortfolioOpen);
    };
  }, [closeContentWithReverse]);

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isContentVisible) {
      event.preventDefault();
      closeContentWithReverse();
      return;
    }

    setIsOpen(false);
  };

  const handleMenuSelect = (
    menuId: MenuContentItem["id"],
    options?: { skipSwitchAnimation?: boolean },
  ) => {
    const skipSwitchAnimation = options?.skipSwitchAnimation ?? false;

    setIsOpen(false);
    setActiveMenuId(menuId);
    router.replace(buildMenuHref(menuId), { scroll: false });

    if (!isContentVisible) {
      setDisplayedMenuId(menuId);
      setIsContentSwitching(false);
      openContent();
      return;
    }

    if (!isContentOpen) {
      openContent();
    }

    if (menuId === displayedMenuId) {
      return;
    }

    if (skipSwitchAnimation) {
      setIsContentSwipeTransitionEnabled(false);
      setContentSwipeOffsetX(0);
      setIsContentSwipeDragging(false);
      setDisplayedMenuId(menuId);
      setIsContentSwitching(false);
      return;
    }

    setIsContentSwitching(true);

    if (switchTimeoutRef.current) {
      clearTimeout(switchTimeoutRef.current);
    }

    switchTimeoutRef.current = setTimeout(() => {
      setDisplayedMenuId(menuId);
      setIsContentSwitching(false);
    }, CONTENT_SWITCH_DURATION);
  };

  const displayedMenu: MenuContentItem | undefined =
    MENU_CONTENT_ITEMS.find((item) => item.id === displayedMenuId) ??
    MENU_CONTENT_ITEMS[0];
  const displayedMenuIndex = MENU_CONTENT_ITEMS.findIndex(
    (item) => item.id === displayedMenuId,
  );
  const safeDisplayedIndex = displayedMenuIndex >= 0 ? displayedMenuIndex : 0;
  const previousMenu =
    MENU_CONTENT_ITEMS[
      (safeDisplayedIndex - 1 + MENU_CONTENT_ITEMS.length) %
        MENU_CONTENT_ITEMS.length
    ];
  const nextMenu =
    MENU_CONTENT_ITEMS[(safeDisplayedIndex + 1) % MENU_CONTENT_ITEMS.length];
  const primaryMenuItems = MENU_CONTENT_ITEMS.filter(
    (item) => item.menuSection === "primary",
  );
  const secondaryMenuItems = MENU_CONTENT_ITEMS.filter(
    (item) => item.menuSection === "secondary",
  );

  useEffect(() => {
    if (!isContentVisible) {
      return;
    }

    const activePanel = swipePanelRefs.current[displayedMenuId];

    if (!activePanel) {
      return;
    }

    const updateHeight = () => {
      setContentSwipeViewportHeight(activePanel.offsetHeight);
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    if (typeof ResizeObserver === "undefined") {
      return () => {
        window.removeEventListener("resize", updateHeight);
      };
    }

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(activePanel);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [displayedMenuId, isContentVisible]);

  const handleContentTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];

    if (contentSwipeTimeoutRef.current) {
      clearTimeout(contentSwipeTimeoutRef.current);
    }

    contentTouchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };

    contentTouchAxisRef.current = null;
    contentTouchWidthRef.current =
      contentSwipeViewportRef.current?.clientWidth ??
      event.currentTarget.clientWidth;
    setIsContentSwipeTransitionEnabled(false);
    setIsContentSwipeDragging(true);
  };

  const handleContentTouchMove = (event: TouchEvent<HTMLElement>) => {
    const start = contentTouchStartRef.current;
    const touch = event.touches[0];

    if (!start || !touch) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (!contentTouchAxisRef.current && (absX > 8 || absY > 8)) {
      contentTouchAxisRef.current = absX >= absY ? "x" : "y";
    }

    if (contentTouchAxisRef.current !== "x") {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const width = Math.max(contentTouchWidthRef.current, 1);
    const clampedDeltaX = Math.max(Math.min(deltaX, width), -width);
    setContentSwipeOffsetX(clampedDeltaX);
  };

  const handleContentTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = contentTouchStartRef.current;
    const touch = event.changedTouches[0];

    if (!start || !touch) {
      return;
    }

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (contentTouchAxisRef.current !== "x") {
      setIsContentSwipeTransitionEnabled(true);
      setContentSwipeOffsetX(0);
      setIsContentSwipeDragging(false);
      contentTouchStartRef.current = null;
      contentTouchAxisRef.current = null;
      return;
    }

    const width = Math.max(contentTouchWidthRef.current, 1);
    const threshold = width * 0.2;

    setIsContentSwipeTransitionEnabled(true);

    if (absX <= absY || absX <= threshold) {
      setContentSwipeOffsetX(0);
      setIsContentSwipeDragging(false);
      contentTouchStartRef.current = null;
      contentTouchAxisRef.current = null;
      return;
    }

    const currentIndex = MENU_CONTENT_ITEMS.findIndex(
      (item) => item.id === displayedMenuId,
    );

    if (currentIndex === -1 || MENU_CONTENT_ITEMS.length < 2) {
      setContentSwipeOffsetX(0);
      setIsContentSwipeDragging(false);
      contentTouchStartRef.current = null;
      contentTouchAxisRef.current = null;
      return;
    }

    const isNext = deltaX < 0;
    const nextIndex = isNext
      ? (currentIndex + 1) % MENU_CONTENT_ITEMS.length
      : (currentIndex - 1 + MENU_CONTENT_ITEMS.length) %
        MENU_CONTENT_ITEMS.length;

    const nextItem = MENU_CONTENT_ITEMS[nextIndex];

    setContentSwipeOffsetX(isNext ? -width : width);
    setIsContentSwipeDragging(false);

    if (nextItem) {
      contentSwipeTimeoutRef.current = setTimeout(() => {
        handleMenuSelect(nextItem.id, { skipSwitchAnimation: true });
        setIsContentSwipeTransitionEnabled(false);
        setContentSwipeOffsetX(0);

        requestAnimationFrame(() => {
          setIsContentSwipeTransitionEnabled(true);
        });
      }, 180);
    }

    contentTouchStartRef.current = null;
    contentTouchAxisRef.current = null;
  };

  const renderMenuContent = (menu: MenuContentItem | undefined) => {
    if (!menu) {
      return null;
    }

    return (
      <>
        <h2 className={`${styles.contentTitle} ${cormorantGaramond.className}`}>
          {menu.contentTitle ?? menu.label}
        </h2>

        <p className={`${styles.contentText} ${cormorantGaramond.className}`}>
          {menu.contentText}
        </p>

        {menu.contentBlocks?.length ? (
          <div className={styles.contentBlocks}>
            {menu.contentBlocks.map((block) => (
              <section key={block.title} className={styles.contentBlock}>
                <h3
                  className={`${styles.contentBlockTitle} ${cormorantGaramond.className}`}
                >
                  {block.title}
                </h3>

                {block.text ? (
                  <p
                    className={`${styles.contentBlockText} ${cormorantGaramond.className}`}
                  >
                    {block.text}
                  </p>
                ) : null}

                {block.items?.length ? (
                  block.ordered ? (
                    <ol className={styles.contentBlockListOrdered}>
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ol>
                  ) : (
                    <ul className={styles.contentBlockList}>
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )
                ) : null}
              </section>
            ))}
          </div>
        ) : null}

        {menu.imageSrc ? (
          <div className={styles.contentMedia}>
            <Image
              src={withBasePath(menu.imageSrc)}
              alt={menu.contentTitle ?? menu.label}
              fill
              sizes="(max-width: 900px) calc(100vw - 120px), 60vw"
              className={styles.contentImage}
            />
          </div>
        ) : null}
      </>
    );
  };

  return (
    <div className={styles.burgerRoot}>
      <button
        type="button"
        className={styles.burgerButton}
        aria-label="Открыть меню"
        aria-expanded={isOpen}
        aria-controls="mini-menu-drawer"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className={styles.burgerLine} />
        <span className={styles.burgerLine} />
        <span className={styles.burgerLine} />
      </button>

      <button
        type="button"
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ""}`}
        aria-label="Закрыть меню"
        onClick={() => setIsOpen(false)}
      />

      <nav
        id="mini-menu-drawer"
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""} ${cormorantGaramond.className}`}
        aria-label="Дополнительная навигация"
      >
        <Link
          href="/"
          className={`${styles.drawerLogo} ${erasLight.className}`}
          onClick={handleLogoClick}
        >
          Tiana
        </Link>

        <SelectMobile
          primaryMenuItems={primaryMenuItems}
          secondaryMenuItems={secondaryMenuItems}
          activeMenuId={activeMenuId}
          buildMenuHref={buildMenuHref}
          onMenuSelect={handleMenuSelect}
          onPortfolioOpen={() => {
            window.dispatchEvent(new CustomEvent("tiana:open-portfolio"));
          }}
          onCloseDrawer={() => setIsOpen(false)}
        />
      </nav>

      <section
        className={`${styles.contentStage} ${isContentVisible ? styles.contentStageVisible : ""} ${isContentOpen ? styles.contentStageOpen : ""} ${isContentClosing ? styles.contentStageClosing : ""}`}
        aria-hidden={!isContentVisible}
      >
        <div className={styles.revealLine} />

        <div className={styles.contentBox}>
          <div
            ref={selectorContainerRef}
            className={`${styles.horizontalSelector} ${cormorantGaramond.className}`}
            role="tablist"
            aria-label="Разделы"
          >
            {MENU_CONTENT_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={buildMenuHref(item.id)}
                role="tab"
                aria-selected={activeMenuId === item.id}
                className={`${styles.selectorItem} ${activeMenuId === item.id ? styles.selectorItemActive : ""}`}
                title={item.label}
                ref={(node) => {
                  selectorItemRefs.current[item.id] = node;
                }}
                onClick={(event) => {
                  event.preventDefault();
                  handleMenuSelect(item.id);
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div
            className={`${styles.contentInner} ${isContentSwitching ? styles.contentSwitching : ""}`}
            onTouchStart={handleContentTouchStart}
            onTouchMove={handleContentTouchMove}
            onTouchEnd={handleContentTouchEnd}
          >
            <div
              ref={contentSwipeViewportRef}
              className={styles.contentSwipeViewport}
              style={
                contentSwipeViewportHeight !== null
                  ? { height: `${contentSwipeViewportHeight}px` }
                  : undefined
              }
            >
              <div
                className={styles.contentSwipeLayer}
                style={{
                  transform: `translateX(calc(-100% + ${contentSwipeOffsetX}px))`,
                  transition:
                    isContentSwipeTransitionEnabled && !isContentSwipeDragging
                      ? "transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1)"
                      : "none",
                }}
              >
                <article
                  className={styles.contentSwipePanel}
                  ref={(node) => {
                    swipePanelRefs.current[previousMenu.id] = node;
                  }}
                >
                  {renderMenuContent(previousMenu)}
                </article>

                <article
                  className={styles.contentSwipePanel}
                  ref={(node) => {
                    swipePanelRefs.current[displayedMenu.id] = node;
                  }}
                >
                  {renderMenuContent(displayedMenu)}
                </article>

                <article
                  className={styles.contentSwipePanel}
                  ref={(node) => {
                    swipePanelRefs.current[nextMenu.id] = node;
                  }}
                >
                  {renderMenuContent(nextMenu)}
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
