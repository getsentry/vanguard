import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { getSlackUserId } from "./gibpotato";

const USERS = [
  { slack_user_id: "U111", slack_email: "alice@example.com" },
  { slack_user_id: "U222", slack_email: "Bob@Example.com" },
  { slack_user_id: "U333", slack_email: "chris@example.com" },
  { slack_user_id: "U444", slack_email: "dana.smith@example.com" },
  { slack_user_id: "U555", slack_email: "erin.jones@example.com" },
  { slack_user_id: "U666", slack_email: "erin.brook@example.com" },
];

describe("getSlackUserId", () => {
  beforeEach(() => {
    process.env.GIBPOTATO_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.GIBPOTATO_API_KEY;
    vi.unstubAllGlobals();
  });

  test("returns the slack user id for a matching email", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(USERS)));
    expect(await getSlackUserId("alice@example.com")).toBe("U111");
  });

  test("matches emails case-insensitively", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(USERS)));
    expect(await getSlackUserId("bob@example.com")).toBe("U222");
  });

  test("sends the bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(USERS));
    vi.stubGlobal("fetch", fetchMock);
    await getSlackUserId("alice@example.com");
    expect(fetchMock).toHaveBeenCalledWith("https://gibpotato.app/api/users", {
      headers: { Authorization: "Bearer test-key" },
    });
  });

  test("returns null when no user matches", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(USERS)));
    expect(await getSlackUserId("nobody@example.com")).toBeNull();
  });

  test("fuzzy-matches full-name email to first-name-only slack email", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(USERS)));
    expect(await getSlackUserId("chris.jannings@example.com")).toBe("U333");
  });

  test("fuzzy-matches first-name-only email to full-name slack email", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(USERS)));
    expect(await getSlackUserId("dana@example.com")).toBe("U444");
  });

  test("prefers the exact match over fuzzy candidates", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(USERS)));
    expect(await getSlackUserId("erin.jones@example.com")).toBe("U555");
  });

  test("returns null when the fuzzy match is ambiguous", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(USERS)));
    expect(await getSlackUserId("erin@example.com")).toBeNull();
  });

  test("does not fuzzy-match across domains", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(USERS)));
    expect(await getSlackUserId("chris.jannings@other.com")).toBeNull();
  });

  test("returns null when GIBPOTATO_API_KEY is not set", async () => {
    delete process.env.GIBPOTATO_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await getSlackUserId("alice@example.com")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("returns null on a non-200 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 401 })));
    expect(await getSlackUserId("alice@example.com")).toBeNull();
  });

  test("returns null when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(await getSlackUserId("alice@example.com")).toBeNull();
  });
});
