import type { ComponentPropsWithoutRef } from "react";

export default function Middot({
  children: _children,
  ...props
}: ComponentPropsWithoutRef<"span">) {
  return (
    <span className="mx-1" {...props}>
      &middot;
    </span>
  );
}
