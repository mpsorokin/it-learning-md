import { useEffect, useRef, type RefObject } from "react";
import { clamp01 } from "@/lib/num";

const SCROLL_THROTTLE_MS = 400;

function scrollRatio(element: HTMLDivElement): number {
  const max = element.scrollHeight - element.clientHeight;
  if (max <= 0) return 0;
  return clamp01(element.scrollTop / max);
}

function scrollToRatio(element: HTMLDivElement, ratio: number): void {
  const max = element.scrollHeight - element.clientHeight;
  element.scrollTop = clamp01(ratio) * max;
}

interface UseReadingScrollOptions {
  lessonId: string;
  scrollRatio: number;
  setLessonScroll: (id: string, ratio: number) => void;
}

/**
 * Restores and persists reader scroll position. The lesson page only writes
 * through actions — it never subscribes to progress state — so markdown does
 * not re-render on every scroll tick.
 */
export function useReadingScroll(
  scroller: RefObject<HTMLDivElement | null>,
  { lessonId, scrollRatio: savedRatio, setLessonScroll }: UseReadingScrollOptions,
): void {
  const pendingRatio = useRef<number | null>(null);
  const throttleTimer = useRef<number | null>(null);
  const restored = useRef(false);

  const flush = () => {
    if (pendingRatio.current === null) return;
    setLessonScroll(lessonId, pendingRatio.current);
    pendingRatio.current = null;
  };

  const scheduleFlush = () => {
    if (throttleTimer.current !== null) return;
    throttleTimer.current = window.setTimeout(() => {
      throttleTimer.current = null;
      flush();
    }, SCROLL_THROTTLE_MS);
  };

  useEffect(() => {
    if (!lessonId) return;

    restored.current = false;
    pendingRatio.current = null;
    if (throttleTimer.current !== null) {
      window.clearTimeout(throttleTimer.current);
      throttleTimer.current = null;
    }

    const element = scroller.current;
    if (!element) return;

    const restore = () => {
      if (restored.current) return;
      restored.current = true;
      scrollToRatio(element, savedRatio);
      // Opening a lesson records that it was visited, even at the top.
      setLessonScroll(lessonId, savedRatio);
    };

    restore();
    // Markdown layout can shift height after the first paint.
    const raf = window.requestAnimationFrame(restore);

    const onScroll = () => {
      pendingRatio.current = scrollRatio(element);
      scheduleFlush();
    };

    element.addEventListener("scroll", onScroll, { passive: true });
    const onPageHide = () => flush();
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.cancelAnimationFrame(raf);
      element.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onPageHide);
      if (throttleTimer.current !== null) {
        window.clearTimeout(throttleTimer.current);
        throttleTimer.current = null;
      }
      flush();
    };
  }, [lessonId, savedRatio, scroller, setLessonScroll]);
}
