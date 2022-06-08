import { summarize } from "~/lib/slack";

describe("summarize", () => {
  test("summarizes short single paragraph ignoring images", async () => {
    const result = summarize("![image.jpg](image)\n\nhello world!");
    expect(result).toBe("hello world!");
  });
});
