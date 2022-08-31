import { expect } from "vitest";

expect.extend({
  async toThrowErrorMatching(error, expected) {
    const pass = expected(error);
    return {
      pass,
      message: () => `we failed`,
    };
  },
});

export const expectRequiresAdmin = async (cb, existingUser = true) => {
  await expect(cb).rejects.toThrowErrorMatching((err) => {
    expect(err.status).toBe(302);
    expect(err.headers?.get("location").split("?")[0]).toBe(
      existingUser ? "/403" : "/login"
    );
    return true;
  });
};

export const expectRequiresUser = async (cb) => {
  await expect(cb).rejects.toThrowErrorMatching((err) => {
    expect(err.status).toBe(302);
    expect(err.headers?.get("location").split("?")[0]).toBe("/login");
    return true;
  });
};
