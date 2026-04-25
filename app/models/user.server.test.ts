import { db } from "~/db/client";
import { users } from "~/db/schema";
import { createUser, getUserList, updateUser, upsertUser } from "~/models/user.server";
import * as Fixtures from "~/lib/test/fixtures";

describe("getUserList", () => {
  let user: typeof users.$inferSelect;

  beforeEach(async () => {
    [user] = await db.insert(users).values({ email: "foo@example.com", name: "Bar" }).returning();
  });

  describe("query", () => {
    test("matches email", async () => {
      const result = await getUserList({ query: "foo" });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(user.id);
    });
    test("matches name", async () => {
      const result = await getUserList({ query: "bar" });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(user.id);
    });
    test("doesnt match everything", async () => {
      const result = await getUserList({ query: "baz" });
      expect(result.length).toBe(0);
    });
  });
});

describe("updateUser", () => {
  let user: Awaited<ReturnType<typeof Fixtures.User>>;

  beforeEach(async () => {
    user = await Fixtures.User();
  });

  it("can change name on self", async () => {
    const newUser = await updateUser({
      id: user.id,
      actor: user,
      name: "Fancy",
    });
    expect(newUser).toBeDefined();
    expect(newUser.name).toBe("Fancy");
  });

  it("can change picture on self", async () => {
    const newUser = await updateUser({
      id: user.id,
      actor: user,
      picture: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
    });
    expect(newUser).toBeDefined();
    expect(newUser.picture).toBe(
      "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
    );
  });

  it("can change notifyReplies on self", async () => {
    const newUser = await updateUser({
      id: user.id,
      actor: user,
      notifyReplies: false,
    });
    expect(newUser).toBeDefined();
    expect(newUser.notifyReplies).toBe(false);
  });

  it("cannot change admin on self", async () => {
    const newUser = await updateUser({
      id: user.id,
      actor: user,
      admin: true,
    });
    expect(newUser).toBeDefined();
    expect(newUser.admin).toBe(false);
  });

  it("cannot change canPostRestricted on self", async () => {
    const newUser = await updateUser({
      id: user.id,
      actor: user,
      canPostRestricted: true,
    });
    expect(newUser).toBeDefined();
    expect(newUser.canPostRestricted).toBe(false);
  });
});

describe("createUser", () => {
  it("creates a new user", async () => {
    const newUser = await createUser({
      email: "foo@example.com",
      name: "Fancy",
    });
    expect(newUser).toBeDefined();
    expect(newUser.id).toBeDefined();
    expect(newUser.name).toBe("Fancy");
    expect(newUser.email).toBe("foo@example.com");
    expect(newUser.admin).toBe(false);
    expect(newUser.canPostRestricted).toBe(false);
    expect(newUser.passwordHash).toBeNull();
  });
});

describe("upsertUser", () => {
  it("promotes the very first authenticated user of an empty database to admin", async () => {
    // setup-test-env truncates all tables and seeds a DEFAULT_USER before each test,
    // so start from a fully empty users table to observe the first-user bootstrap.
    await db.delete(users);
    const user = await upsertUser({
      email: "first@example.com",
      externalId: "google-first",
    });
    expect(user.admin).toBe(true);
  });

  it("does not promote subsequent users", async () => {
    // DEFAULT_USER already exists from the test setup, so this is not the first user.
    const user = await upsertUser({
      email: "second@example.com",
      externalId: "google-second",
    });
    expect(user.admin).toBe(false);
  });

  it("promotes the first authenticated user even if placeholder seed users exist", async () => {
    // Simulate `pnpm db:seed` having created a placeholder user with no externalId.
    // That row owns seeded sample content but can never sign in, and must not prevent
    // the first real Google sign-in from being granted admin.
    await db.delete(users);
    await Fixtures.User({ email: "demo@example.com", externalId: null });
    const user = await upsertUser({
      email: "first@example.com",
      externalId: "google-first",
    });
    expect(user.admin).toBe(true);
  });

  it("preserves the admin flag on an existing user across re-login", async () => {
    const existing = await Fixtures.User({
      email: "admin@example.com",
      externalId: "google-admin",
      admin: true,
    });
    const roundTripped = await upsertUser({
      email: "admin@example.com",
      externalId: "google-admin",
    });
    expect(roundTripped.id).toBe(existing.id);
    expect(roundTripped.admin).toBe(true);
  });
});
