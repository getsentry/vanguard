// @ts-nocheck
import { vi } from "vitest";

import type { Post } from "~/models/post.server";
import type { User } from "~/models/user.server";
import * as email from "~/lib/email";
import { expectRequiresAdmin, expectRequiresUser } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";
import { buildRequest } from "~/lib/test/request";

import { action } from "./api.posts.$postId_.test-email";

describe("POST /api/posts/$postId/test-email", () => {
  let admin: User;
  let post: Post;
  let originalSmtpFrom: string | undefined;
  let originalBaseUrl: string | undefined;

  beforeEach(async () => {
    admin = await Fixtures.User({ admin: true });
    post = await Fixtures.Post({ authorId: admin.id });

    originalSmtpFrom = process.env.SMTP_FROM;
    originalBaseUrl = process.env.BASE_URL;
  });

  afterEach(() => {
    if (originalSmtpFrom === undefined) delete process.env.SMTP_FROM;
    else process.env.SMTP_FROM = originalSmtpFrom;
    if (originalBaseUrl === undefined) delete process.env.BASE_URL;
    else process.env.BASE_URL = originalBaseUrl;
    vi.restoreAllMocks();
  });

  it("requires user", async () => {
    await expectRequiresUser(
      action({
        request: await buildRequest(`http://localhost/api/posts/${post.id}/test-email`, {
          method: "POST",
        }),
        params: { postId: post.id },
        context: {},
      }),
    );
  });

  it("requires admin", async () => {
    const nonAdmin = await Fixtures.User({ admin: false });
    await expectRequiresAdmin(
      action({
        request: await buildRequest(
          `http://localhost/api/posts/${post.id}/test-email`,
          { method: "POST" },
          { user: nonAdmin },
        ),
        params: { postId: post.id },
        context: {},
      }),
    );
  });

  it("returns 405 for non-POST methods", async () => {
    const res = await action({
      request: await buildRequest(
        `http://localhost/api/posts/${post.id}/test-email`,
        { method: "GET" },
        { user: admin },
      ),
      params: { postId: post.id },
      context: {},
    });
    expect(res.status).toBe(405);
  });

  it("returns 404 when post does not exist", async () => {
    const res = await action({
      request: await buildRequest(
        `http://localhost/api/posts/missing/test-email`,
        { method: "POST" },
        { user: admin },
      ),
      params: { postId: "missing" },
      context: {},
    });
    expect(res.status).toBe(404);
  });

  it("returns 503 when SMTP is not configured", async () => {
    delete process.env.SMTP_FROM;
    process.env.BASE_URL = "http://localhost";

    const notifySpy = vi.spyOn(email, "notify").mockResolvedValue(undefined);

    const res = await action({
      request: await buildRequest(
        `http://localhost/api/posts/${post.id}/test-email`,
        { method: "POST" },
        { user: admin },
      ),
      params: { postId: post.id },
      context: {},
    });

    expect(res.status).toBe(503);
    expect(notifySpy).not.toHaveBeenCalled();
  });

  it("sends the email to the admin and returns ok", async () => {
    process.env.SMTP_FROM = "vanguard@example.com";
    process.env.BASE_URL = "http://localhost";

    const notifySpy = vi.spyOn(email, "notify").mockResolvedValue(undefined);

    const res = await action({
      request: await buildRequest(
        `http://localhost/api/posts/${post.id}/test-email`,
        { method: "POST" },
        { user: admin },
      ),
      params: { postId: post.id },
      context: {},
    });

    expect(res).toEqual({ ok: true, to: admin.email });
    expect(notifySpy).toHaveBeenCalledOnce();
    const call = notifySpy.mock.calls[0][0];
    expect(call.config.to).toBe(admin.email);
    expect(call.config.subjectPrefix).toBe("[TEST]");
    expect(call.post.id).toBe(post.id);
  });

  it("returns 500 when notify throws", async () => {
    process.env.SMTP_FROM = "vanguard@example.com";
    process.env.BASE_URL = "http://localhost";

    vi.spyOn(email, "notify").mockRejectedValue(new Error("smtp boom"));
    // Suppress console.error from the route's own logging during the throw.
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await action({
      request: await buildRequest(
        `http://localhost/api/posts/${post.id}/test-email`,
        { method: "POST" },
        { user: admin },
      ),
      params: { postId: post.id },
      context: {},
    });

    expect(res.status).toBe(500);
  });
});
