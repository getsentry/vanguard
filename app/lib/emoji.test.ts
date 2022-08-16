import { isEmoji } from "./emoji";

const NOT_EMOJI = ["a", "0", "hello", "world", "abc", "0123"];

const EMOJI = ["🦰", "🌼", "🌺", "🌸"];

describe("isEmoji", () => {
  test("disqualifies non-emoji", async () => {
    NOT_EMOJI.forEach((item) => {
      expect(isEmoji(item), `testing ${item}`).toBe(false);
    });
  });

  test("qualifies emoji", async () => {
    EMOJI.forEach((item) => {
      expect(isEmoji(item), `testing ${item}`).toBe(true);
    });
  });
});
