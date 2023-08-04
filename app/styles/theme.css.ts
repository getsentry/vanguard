import { violet } from "@radix-ui/colors";
import {
  createGlobalTheme,
  createTheme,
  createThemeContract,
} from "@vanilla-extract/css";

const rawColors = {
  white: "#fff",
  gray100: "#f7f6fa",
  gray200: "#d0cbdf",
  gray300: "#aaa1c3",
  gray400: "#857aaa",
  gray500: "#60557f",
  gray600: "#3d3353",
  black: "#1d142a",
  green: "#65cb35",
  yellow: "#ffca00",
  orange: "#ff7a00",
  red: "#f0345f",
  purple: "#7854F6",
  blue: "#00a3ff",
};

const colors = createThemeContract({
  ...rawColors,

  bg: null,
  bgLayer100: null,
  border: null,
  borderFocus: null,
  text: null,
  textSecondary: null,
  textMuted: null,
  link: null,
  tabActive: null,
  loadingIndicator: null,
  alert: {
    backgroundColor: null,
    textColor: null,
  },
  button: {
    defaultBackgroundColor: null,
    defaultTextColor: null,
    primaryBackgroundColor: null,
    primaryTextColor: null,
  },
  emoji: {
    defaultBackgroundColor: null,
    defaultTextColor: null,
    selectedBackgroundColor: null,
    selectedTextColor: null,
    highlightBackgroundColor: null,
    highlightTextColor: null,
  },
  categories: {
    shipped: {
      bgColor: null,
      textColor: null,
    },
    sentry: {
      bgColor: null,
      textColor: null,
    },
    strategy: {
      bgColor: null,
      textColor: null,
    },
  },
});

const root = createGlobalTheme("#app", {
  // space: {
  //   small: "4px",
  //   medium: "8px",
  //   large: "16px"
  // },
  fonts: {
    base: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    monospace: '"IBM Plex Mono", monospaced',
    header: '"Gazpacho-Heavy", serif',
  },
});

export const lightTheme = createTheme(colors, {
  ...rawColors,

  bg: rawColors.white,
  bgLayer100: rawColors.gray100,
  border: rawColors.gray200,
  borderFocus: rawColors.gray300,
  text: rawColors.black,
  textSecondary: rawColors.gray500,
  textMuted: rawColors.gray400,
  link: rawColors.red,
  tabActive: violet.violet11,
  loadingIndicator: rawColors.purple,
  alert: {
    backgroundColor: rawColors.purple,
    textColor: rawColors.white,
  },
  button: {
    defaultBackgroundColor: rawColors.white,
    defaultTextColor: rawColors.gray400,
    primaryBackgroundColor: rawColors.black,
    primaryTextColor: rawColors.white,
  },
  emoji: {
    defaultBackgroundColor: rawColors.gray100,
    defaultTextColor: rawColors.gray500,
    selectedBackgroundColor: rawColors.purple,
    selectedTextColor: rawColors.white,
    highlightBackgroundColor: rawColors.gray200,
    highlightTextColor: rawColors.gray500,
  },
  categories: {
    shipped: {
      bgColor: rawColors.purple,
      textColor: rawColors.white,
    },
    sentry: {
      bgColor: rawColors.yellow,
      textColor: rawColors.black,
    },
    strategy: {
      bgColor: rawColors.yellow,
      textColor: rawColors.black,
    },
  },
});

export const darkTheme = createTheme(colors, {
  ...rawColors,

  bg: rawColors.black,
  bgLayer100: "#221930",
  border: rawColors.gray600,
  borderFocus: rawColors.gray500,
  text: rawColors.gray100,
  textSecondary: rawColors.gray300,
  textMuted: rawColors.gray400,
  link: "#FF557C",
  tabActive: rawColors.gray200,
  loadingIndicator: rawColors.purple,
  alert: {
    backgroundColor: rawColors.purple,
    textColor: rawColors.white,
  },
  button: {
    defaultBackgroundColor: rawColors.black,
    defaultTextColor: rawColors.gray400,
    primaryBackgroundColor: rawColors.gray200,
    primaryTextColor: rawColors.black,
  },
  emoji: {
    defaultBackgroundColor: rawColors.gray100,
    defaultTextColor: rawColors.gray500,
    selectedBackgroundColor: rawColors.purple,
    selectedTextColor: rawColors.white,
    highlightBackgroundColor: rawColors.gray200,
    highlightTextColor: rawColors.gray500,
  },
  categories: {
    shipped: {
      bgColor: rawColors.purple,
      textColor: rawColors.white,
    },
    sentry: {
      bgColor: rawColors.yellow,
      textColor: rawColors.black,
    },
    strategy: {
      bgColor: rawColors.yellow,
      textColor: rawColors.black,
    },
  },
});

export const vars = { ...root, colors };
