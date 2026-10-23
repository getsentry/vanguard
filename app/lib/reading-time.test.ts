import readingTime from "./reading-time";

const words = (count: number) => Array.from({ length: count }, () => "word").join(" ");

describe("readingTime", () => {
  test("ignores inline svg markup", async () => {
    const svg = `<svg viewBox="0 0 10 10"><path d="${"M0 0 L10 10 ".repeat(5000)}"/><text>label</text></svg>`;
    expect(readingTime(`${words(230)}\n\n${svg}`)).toBe("1 minute");
  });

  test("ignores image embeds and link urls", async () => {
    const url = `https://example.com/${"a/".repeat(2000)}`;
    expect(readingTime(`![diagram](${url})\n\n[a link](${url})\n\n${words(228)}`)).toBe("1 minute");
  });

  test("counts tags mentioned in code as text", async () => {
    const content = `Use \`<svg>\` for diagrams.\n\n${words(230)}\n\n\`\`\`html\n</svg>\n\`\`\``;
    expect(readingTime(content)).toBe("2 minutes");
  });

  test("ignores html comments", async () => {
    expect(readingTime(`<!-- ${words(500)} -->\n\n${words(230)}`)).toBe("1 minute");
  });

  test("counts words at 230 per minute", async () => {
    expect(readingTime(words(231))).toBe("2 minutes");
    expect(readingTime(words(231), false)).toBe("2 minute");
  });

  test("rounds long posts to whole hours", async () => {
    expect(readingTime(words(230 * 90))).toBe("2 hours");
  });
});
