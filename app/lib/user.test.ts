import { getDisplayName } from "./user";

describe("getDisplayName", () => {
  test("returns name when set", () => {
    expect(getDisplayName({ name: "Ada Lovelace", email: "ada@example.com" })).toBe("Ada Lovelace");
  });

  test("falls back to email when name is null", () => {
    expect(getDisplayName({ name: null, email: "ada@example.com" })).toBe("ada@example.com");
  });

  test("falls back to email when name is empty string", () => {
    expect(getDisplayName({ name: "", email: "ada@example.com" })).toBe("ada@example.com");
  });
});
