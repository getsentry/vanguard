/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/node" />

import type { User } from "~/models/user.server";

declare global {
  export const DefaultFixtures: {
    DEFAULT_USER: User;
  };
}
