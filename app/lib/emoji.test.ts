import { isEmoji, isEmojiValue, isShortcode, renderShortcodes, shortcodeName } from "./emoji";

const NOT_EMOJI = ["a", "0", "hello", "world", "abc", "0123"];
const EMOJI = ["🦰", "🌼", "🌺", "🌸", "🇨🇦"];

describe("isEmoji", () => {
  test("disqualifies non-emoji", async () => {
    NOT_EMOJI.forEach((item) => {
      console.log(`testing ${item}`);
      expect(isEmoji(item)).toBe(false);
    });
  });

  test("qualifies emoji", async () => {
    EMOJI.forEach((item) => {
      console.log(`testing ${item}`);
      expect(isEmoji(item)).toBe(true);
    });
  });
});

describe("isShortcode", () => {
  test("qualifies Slack shortcodes", () => {
    [":shipit:", ":party-parrot:", ":thumbsup_all:", ":a+:", ":cant'stop:"].forEach((item) => {
      expect(isShortcode(item)).toBe(true);
    });
  });

  test("disqualifies everything else", () => {
    ["shipit", ":shipit", "shipit:", "::", ":a b:", ":shipit::shipit:", "❤️"].forEach((item) => {
      expect(isShortcode(item)).toBe(false);
    });
  });
});

describe("shortcodeName", () => {
  test("extracts and lowercases the name", () => {
    expect(shortcodeName(":ShipIt:")).toBe("shipit");
  });

  test("returns null for a non-shortcode", () => {
    expect(shortcodeName("❤️")).toBe(null);
  });
});

describe("isEmojiValue", () => {
  test("accepts unicode emoji and shortcodes", () => {
    expect(isEmojiValue("🌼")).toBe(true);
    expect(isEmojiValue(":shipit:")).toBe(true);
  });

  test("rejects plain text", () => {
    expect(isEmojiValue("hello")).toBe(false);
  });
});

describe("renderShortcodes", () => {
  test("replaces every shortcode with an image", () => {
    expect(renderShortcodes("hi :shipit: and :parrot:")).toBe(
      'hi <img class="emoji" src="/emoji/shipit" alt=":shipit:" title=":shipit:" /> and ' +
        '<img class="emoji" src="/emoji/parrot" alt=":parrot:" title=":parrot:" />',
    );
  });

  test("prefixes a base url when given one", () => {
    expect(renderShortcodes(":shipit:", "https://vanguard.example")).toContain(
      'src="https://vanguard.example/emoji/shipit"',
    );
  });

  test("leaves text without shortcodes alone", () => {
    expect(renderShortcodes("meet at 10:30 today")).toBe("meet at 10:30 today");
  });
});
