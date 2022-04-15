import { violet } from "@radix-ui/colors";

const colors = {
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
  purple: "#00a3ff",
  blue: "#00a3ff",
}

const lightTheme = {
  bgColor: colors.white,
  bgLayer100: colors.gray100,
  borderColor: colors.gray200,
  borderFocusColor: colors.gray300,
  textColor: colors.black,
  textColorSecondary: colors.gray500,
  textMuted: colors.gray400,
  linkColor: colors.red,
  tabActiveColor: violet.violet11,
  button: {
    defaultBackgroundColor: "transparent",
    defaultTextColor: colors.gray400,
    primaryBackgroundColor: colors.black,
    primaryTextColor: colors.white
  }
};

const darkTheme = {
  bgColor: colors.black,
  bgLayer100: "#221930",
  borderColor: colors.gray600,
  borderFocusColor: colors.gray500,
  textColor: colors.gray100,
  textColorSecondary: colors.gray300,
  textMuted: colors.gray400,
  linkColor: "#FF557C",
  tabActiveColor: colors.gray200,
  button: {
    defaultBackgroundColor: "transparent",
    defaultTextColor: colors.gray400,
    primaryBackgroundColor: colors.gray200,
    primaryTextColor: colors.black
  }
};

export {lightTheme, darkTheme};
