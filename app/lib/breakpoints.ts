import { css } from "styled-components";
import type { Styles } from "styled-components/dist/types";

export const breakpoints = {
  mobile: 0,
  tablet: 737,
  desktop: 1195,
};

export const mediaQueries = {
  mobile: `(max-width: ${breakpoints.desktop - 1}px)`,
  desktop: `(min-width: ${breakpoints.desktop}px)`,
};

type Breakpoint = keyof typeof breakpoints;

function convertPxToEm(pixels: number): number {
  // @media is always calculated off 16px regardless of whether the root font size is the default or not
  return pixels / 16;
}

function _between(gte: Breakpoint, lt: Breakpoint) {
  return function (strings: Styles<object>, ...interpolations: string[]) {
    return css`
      @media (min-width: ${convertPxToEm(
          breakpoints[gte],
        )}em) and (max-width: ${convertPxToEm(breakpoints[lt] - 1)}em) {
        ${css(strings, ...interpolations)}
      }
    `;
  };
}

function _gte(gte: Breakpoint) {
  return function (strings: Styles<object>, ...interpolations: string[]) {
    return css`
      @media (min-width: ${convertPxToEm(breakpoints[gte])}em) {
        ${css(strings, ...interpolations)}
      }
    `;
  };
}

export function breakpoint(gte: Breakpoint, lt?: Breakpoint) {
  if (typeof lt !== "undefined") return _between(gte, lt);
  return _gte(gte);
}
