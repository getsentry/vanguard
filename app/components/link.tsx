import { Link as UnstyledLink } from "react-router";
import type { ComponentPropsWithoutRef } from "react";
import classNames from "~/lib/classNames";

export default function Link({
  color = "default",
  ...props
}: ComponentPropsWithoutRef<typeof UnstyledLink> & {
  color?: "default" | "none";
}) {
  return (
    <UnstyledLink
      className={classNames(
        color === "default" ? "text-link-light dark:text-link-dark" : "",
        "hover:underline",
      )}
      {...props}
    />
  );
}
