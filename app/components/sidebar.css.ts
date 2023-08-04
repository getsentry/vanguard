import { style } from "@vanilla-extract/css";
import { mediaQueries } from "~/lib/breakpoints";
import { vars } from "~/styles/theme.css";

export const wrapper = style({
  position: "fixed",
  width: "40rem",
  padding: "6rem 5rem",
  top: 0,
  bottom: 0,
  transition: "all 0.2s ease-in-out",
  zIndex: 0,

  ":after": {
    content: "",
    display: "block",
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: "-10rem",
    background: vars.colors.bgLayer100,
    transform: "skewx(4deg)",
    zIndex: -1,
  },

  "@media": {
    [mediaQueries.mobile]: {
      right: "-100%",

      ":after": {
        boxShadow:
          "0 5px 40px rgba(0, 0, 0, .08), 0 5px 20px rgba(0, 0, 0, .05)",
      },
    },

    [mediaQueries.desktop]: {
      // Always show sidebar on desktop
      right: 0,
    },
  },
});

// ${breakpoint("mobile", "desktop")`
//   right: -100%;
//   &:after {
//   }

//   ${(p) =>
//     p.showSidebar &&
//     css`
//       right: 0;
//     `}
// `}

export const section = style({
  marginBottom: "3.2rem",
});
