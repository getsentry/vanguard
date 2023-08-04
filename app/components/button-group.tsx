import type { ComponentPropsWithoutRef } from "react";
import classNames from "~/lib/classNames";

export default function ButtonGroup({
  align = "end",
  ...props
}: ComponentPropsWithoutRef<"div"> & {
  align?: "center" | "end";
}) {
  return (
    <div
      className={classNames(
        "flex gap-2",
        align === "center" ? "justify-center" : "justify-end",
      )}
      {...props}
    />
  );
}
