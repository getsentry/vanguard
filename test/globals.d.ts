import type { User } from "~/models/user.server";

declare global {
  let DefaultFixtures: {
    DEFAULT_USER: User;
  };
}
