import { style } from "@vanilla-extract/css";
import { mediaQueries } from "~/lib/breakpoints";
import { vars } from "~/styles/theme.css";

export const mainContainer = style({
  position: "relative",
});

export const primary = style({
  paddingBottom: "6rem",
  transition: "margin-right 0.2s ease-in-out",

  "@media": {
    [mediaQueries.desktop]: {
      width: "80%",
      padding: "0 5rem",
      marginRight: "40rem",
      position: "relative",
      zIndex: 1,
    },
  },
});

export const userMenu = style({
  alignItems: "center",
  display: "flex",
});

export const userMenuDivider = style({
  color: vars.colors.border,
  fontFamily: vars.fonts.monospace,

  ":before": {
    content: "/",
  },
});
