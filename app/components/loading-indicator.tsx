import { useTransition } from "@remix-run/react";
import type { ReactElement } from "react";
import { useEffect, useRef } from "react";

// https://edmund.dev/articles/setting-up-a-global-loading-indicator-in-remix
function useProgress() {
  const el = useRef<HTMLDivElement>(null);
  const timeout = useRef<NodeJS.Timeout>();
  const { location } = useTransition();

  useEffect(() => {
    if (!location || !el.current) {
      return;
    }

    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    el.current.style.width = `0%`;

    let updateWidth = (ms: number) => {
      timeout.current = setTimeout(() => {
        let width = parseFloat(el.current!.style.width);
        let percent = !isNaN(width) ? 10 + 0.9 * width : 0;

        el.current!.style.width = `${percent}%`;

        updateWidth(100);
      }, ms);
    };

    updateWidth(300);

    return () => {
      clearTimeout(timeout.current);

      if (el.current!.style.width === `0%`) {
        return;
      }

      el.current!.style.width = `100%`;
      timeout.current = setTimeout(() => {
        if (el.current?.style.width !== "100%") {
          return;
        }
        el.current!.style.width = ``;
      }, 200);
    };
  }, [location]);

  return el;
}

export default function LoadingIndicator(): ReactElement {
  const progress = useProgress();

  return (
    <div className="fixed left-0 right-0 top-0 flex z-[2147483647]">
      <div
        className="h-4 bg-loading-light dark:bg-loading-dark"
        ref={progress}
      />
    </div>
  );
}
