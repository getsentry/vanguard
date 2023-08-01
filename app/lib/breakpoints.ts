import { css } from "styled-components";
import type { Styles } from "styled-components/dist/types";

const BreakpointMap = {
  mobile: 0,
  tablet: 737,
  desktop: 1195,
};

type Breakpoint = keyof typeof BreakpointMap;

function convertPxToEm(pixels: number): number {
  // @media is always calculated off 16px regardless of whether the root font size is the default or not
  return pixels / 16;
}

function _between(gte: Breakpoint, lt: Breakpoint) {
  return function (strings: Styles<object>, ...interpolations: string[]) {
    return css`
      @media (min-width: ${convertPxToEm(
          BreakpointMap[gte]
        )}em) and (max-width: ${convertPxToEm(BreakpointMap[lt] - 1)}em) {
        ${css(strings, ...interpolations)}
      }
    `;
  };
}

function _gte(gte: Breakpoint) {
  return function (strings: Styles<object>, ...interpolations: string[]) {
    return css`
      @media (min-width: ${convertPxToEm(BreakpointMap[gte])}em) {
        ${css(strings, ...interpolations)}
      }
    `;
  };
}

export function breakpoint(gte: Breakpoint, lt?: Breakpoint) {
  if (typeof lt !== "undefined") return _between(gte, lt);
  return _gte(gte);
}
