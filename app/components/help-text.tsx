import type { ComponentPropsWithoutRef } from "react";

export default function HelpText(props: ComponentPropsWithoutRef<"div">) {
  return (
    <div className="text-muted-light dark:text-muted-dark text-sm" {...props} />
  );
}
