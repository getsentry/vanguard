import { useTransition } from "@remix-run/react";
import type { MutableRefObject, ReactElement } from "react";
import { useEffect, useRef } from "react";
import styled from "styled-components";

// https://edmund.dev/articles/setting-up-a-global-loading-indicator-in-remix
function useProgress(): MutableRefObject<HTMLElement> {
  const el = useRef<HTMLElement>();
  const timeout = useRef<NodeJS.Timeout>();
  const { location } = useTransition();

  useEffect(() => {
    console.log("here");
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

const Container = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  display: flex;
`;

const Indicator = styled.div`
  background: ${(p) => p.theme.loadingIndicator};
  height: 1rem;
`;

export default function LoadingIndicator(): ReactElement {
  const progress = useProgress();

  return (
    <Container>
      <Indicator ref={progress} />
    </Container>
  );
}
