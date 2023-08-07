import type { ComponentPropsWithoutRef } from "react";

export default function HelpText(props: ComponentPropsWithoutRef<"div">) {
  return <div className="text-gray-800 text-xs" {...props} />;
}
