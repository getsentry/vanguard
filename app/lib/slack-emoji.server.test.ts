import { toEmojiEntries } from "./slack-emoji.server";

describe("toEmojiEntries", () => {
  it("maps a custom emoji to its url", () => {
    expect(toEmojiEntries({ shipit: "https://emoji.slack-edge.com/T0/shipit/a.png" })).toEqual([
      { name: "shipit", url: "https://emoji.slack-edge.com/T0/shipit/a.png", aliasFor: null },
    ]);
  });

  it("maps an alias to its target", () => {
    expect(toEmojiEntries({ "ship-it": "alias:shipit" })).toEqual([
      { name: "ship-it", url: null, aliasFor: "shipit" },
    ]);
  });

  it("lowercases names and alias targets", () => {
    expect(toEmojiEntries({ ShipIt: "alias:Squirrel" })).toEqual([
      { name: "shipit", url: null, aliasFor: "squirrel" },
    ]);
  });

  it("skips names that would not fit the column", () => {
    expect(toEmojiEntries({ [`a`.repeat(101)]: "https://example.com/a.png" })).toEqual([]);
  });

  it("skips names with characters Slack does not allow", () => {
    expect(toEmojiEntries({ "bad name": "https://example.com/a.png" })).toEqual([]);
  });
});
