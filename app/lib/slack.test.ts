import { summarize } from "~/lib/slack";

describe("summarize", () => {
  test("summarizes short single paragraph ignoring images", async () => {
    const result = summarize("![image.jpg](image)\n\nhello world!", 8);
    expect(result).toBe("hello...");
  });
});

describe("summarize", () => {
  test("summarizes short single paragraph ignoring headers", async () => {
    const result = summarize("# foo bar\n\nhello world!", 8);
    expect(result).toBe("hello...");
  });
});
