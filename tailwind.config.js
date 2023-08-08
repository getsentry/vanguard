/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

const colors = require("tailwindcss/colors");

module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    colors: {
      ...colors,
      transparent: "transparent",
      current: "currentColor",
      primary: {
        light: "#1d142a",
        dark: "#f7f6fa",
      },
      secondary: {
        light: "#60557f",
        dark: "#aaa1c3",
      },
      tabs: {
        active: {
          light: colors.violet[900],
          dark: "#d0cbdf",
        },
      },
      bg: {
        light: "#ffffff",
        dark: "#1d142a",
      },
      layer100: {
        light: "#f7f6fa",
        dark: "#221930",
      },
      border: {
        light: "#d0cbdf",
        dark: "#3d3353",
      },
      borderfocus: {
        light: "#60557f",
        dark: "#aaa1c3",
      },
      muted: {
        light: "#60557f",
        dark: "#aaa1c3",
      },
      link: {
        light: "#f0345f",
        dark: "#FF557C",
      },
      loading: {
        light: "#7854F6",
        dark: "#7854F6",
      },
      emoji: {
        default: {
          bg: {
            light: "#f7f6fa",
            dark: "#f7f6fa",
          },
          text: {
            light: "#60557f",
            dark: "#60557f",
          },
        },
        selected: {
          bg: {
            light: "#7854F6",
            dark: "#7854F6",
          },
          text: {
            light: "#ffffff",
            dark: "#ffffff",
          },
        },
        highlight: {
          bg: {
            light: "#d0cbdf",
            dark: "#d0cbdf",
          },
          text: {
            light: "#60557f",
            dark: "#60557f",
          },
        },
      },

      button: {
        default: {
          bg: {
            light: "#ffffff",
            dark: "#1d142a",
          },
          text: {
            light: "#857aaa",
            dark: "#857aaa",
          },
        },
        primary: {
          bg: {
            light: "#1d142a",
            dark: "#d0cbdf",
          },
          text: {
            light: "#ffffff",
            dark: "#1d142a",
          },
        },
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        serif: ["Gazpacho-Heavy", ...defaultTheme.fontFamily.serif],
        mono: ["IBM Plex Mono", ...defaultTheme.fontFamily.mono],
      },

      animation: {
        fadeIn: "0.5s fadeIn forwards",
        fadeOut: "0.5s fadeOut forwards",
      },

      // that is actual animation
      keyframes: (theme) => ({
        fadeIn: {
          "0%": { opacity: 0, transform: "translate(-20px, 0)" },
          "100%": { opacity: 1, transform: "translate(0, 0)" },
        },
        fadeOut: {
          "0%": { opacity: 1, transform: "translate(0, 0)" },
          "100%": { opacity: 0, transform: "translate(-20px, 0)" },
        },
      }),
    },
  },
  plugins: [
    // require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};
