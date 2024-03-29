import summarize from "./summarize";

describe("summarize", () => {
  test("summarizes short single paragraph ignoring images", async () => {
    const result = summarize("![image.jpg](image)\n\nhello world!", 8);
    expect(result).toBe("hello...");
  });

  test("summarizes short single paragraph ignoring headers", async () => {
    const result = summarize("# foo bar\n\nhello world!", 8);
    expect(result).toBe("hello...");
  });

  test("summarizes multi paragraph", async () => {
    const result = summarize("**hello world**\n\nthis is a test\n\nfoo bar", 8);
    expect(result).toBe("hello...");
  });
});
