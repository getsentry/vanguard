import { globalStyle } from "@vanilla-extract/css";

import { mediaQueries } from "~/lib/breakpoints";
import { vars } from "./theme.css";

globalStyle("html", {
  minHeight: "100vh",

  "@media": {
    [mediaQueries.desktop]: {
      fontSize: "62.5%",
    },

    [mediaQueries.mobile]: {
      fontSize: "50%",
    },
  },
});

globalStyle("body", {
  fontSize: "1.6rem",
  fontFamily: vars.fonts.base,
  background: vars.colors.bg,
  color: vars.colors.text,
  minHeight: "100vh",
  overflowX: "hidden",
  // -webkit-font-smoothing: antialiased;
  fontSmooth: "always",
});

// globalStyle("*", {
//   boxSizing: "border-box",
//   "::before": {
//     boxSizing: "border-box",
//   },
//   "::after": {
//     boxSizing: "border-box",
//   },
// })

globalStyle("a", {
  color: vars.colors.link,
});

globalStyle("h1, h2, h3, h4, h5, h6", {
  lineHeight: 1.2,
  fontWeight: 600,
  marginBottom: "2.4rem",
});

globalStyle("h1", {
  fontSize: "4.4rem",
  marginBottom: "3.2rem",
  fontFamily: vars.fonts.header,
});

globalStyle("h2", {
  fontSize: "3rem",
});

globalStyle("h3", {
  fontSize: "2.6rem",
});

globalStyle("h4", {
  fontSize: "2.25rem",
});

globalStyle("h5", {
  fontSize: "1.875rem",
});

globalStyle("h6", {
  fontSize: "1.rem",
  fontWeight: 600,
  textTransform: "uppercase",
  marginBottom: "1.6rem",
  color: vars.colors.textMuted,
});

globalStyle("hr, p, ul, ol, blockquote, form, table, pre", {
  fontSize: "1.8rem",
  marginBottom: "3rem",
  lineHeight: 1.6,
});

globalStyle("blockquote", {
  paddingLeft: "1rem",
  borderLeft: `1px solid ${vars.colors.border}`,
});

globalStyle("ul ul, ul ol, ol ul, ol ol", {
  marginBottom: 0,
});

globalStyle("ol, ul", {
  listStylePosition: "outside",
  paddingLeft: "3.2rem",
});

globalStyle("li::marker", {
  fontFamily: vars.fonts.monospace,
  color: vars.colors.textMuted,
});

// xxx: why isnt this in the above defn?
globalStyle("ul li::marker", {
  fontSize: "2rem",
});

globalStyle("ol", {
  listStyleType: "number",
});

globalStyle("ul", {
  listStyleType: "disc",
});

globalStyle("pre, code", {
  fontFamily: vars.fonts.monospace,
});

globalStyle("pre", {
  whiteSpace: ["pre-wrap", "-moz-pre-wrap"],
  wordWrap: "break-word",
});

globalStyle("label", {
  display: "flex",
  flexDirection: "column",
  marginBottom: "2.4rem",
});

globalStyle("label.field-inline", {
  flexDirection: "row",
  alignItems: "center",
  gap: "0.8rem",
  cursor: "pointer",
});

globalStyle("label span", {
  marginBottom: "1.2rem",
  fontWeight: 500,
  fontFamily: vars.fonts.monospace,
  position: "relative",
});

globalStyle("label.field-required span:before", {
  content: "* ",
  position: "absolute",
  left: "-1.5ch",
});

globalStyle("label input, label textarea, label select", {
  background: vars.colors.bg,
  border: `1px solid ${vars.colors.border}`,
  padding: "0.5rem 1rem",
  borderRadius: "4px",
  display: "block",
  fontFamily: vars.fonts.base,
});

globalStyle(
  "label input:focus, label input:focus-visible, label textarea:focus, label textarea:focus-visible, label select:focus, label select:focus-visible",
  {
    borderColor: vars.colors.borderFocus,
    outlineColor: vars.colors.borderFocus,
  },
);

// .logo {
//   color: ${(p) => p.theme.textColor};
// }

// .page-title {
//   font-size: 2.6rem;
//   font-family: "IBM Plex Mono", monospace;
//   text-transform: uppercase;
//   color: ${(p) => p.theme.textColorSecondary};
//   padding-bottom: 3.2rem;
//   border-bottom: 3px solid ${(p) => p.theme.bgLayer100};
// }

// /* Button */

// .btn {
//   padding: 1.2rem 1.6rem;
//   border-radius: 0.4rem;
//   line-height: 1;
//   display: inline-flex;
//   align-items: center;
//   font-family: "IBM Plex Mono", monospace;
//   color: ${(p) => p.theme.textMuted};
//   white-space: nowrap;

//   &.btn-primary {
//     background: ${(p) => p.theme.button.primaryBackgroundColor};
//     color: ${(p) => p.theme.button.primaryTextColor};
//   }

//   // here you go chris
//   &.btn-danger {
//     background: red;
//     color: white;
//   }

//   &.btn-sm {
//     padding: 0.8rem 1.2rem;
//     font-size: 0.9em;
//   }

//   &.btn-xs {
//     padding: 0.6rem 1rem;
//     font-size: 0.8em;
//   }
// }

// .btn-link {
//   display: inline;
//   border: 0;
//   background: inherit;
//   color: ${(p) => p.theme.linkColor};
//   padding: 0;
//   margin: 0;

//   &.btn-sm {
//     font-size: 0.9em;
//   }

//   &.btn-xs {
//     font-size: 0.8em;
//   }
// }
// /* Post */

// .post {
//   padding: 2rem 0;
//   position: relative;
// }
