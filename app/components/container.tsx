import type { ComponentPropsWithoutRef } from "react";

export default function Container(props: ComponentPropsWithoutRef<"div">) {
  return <div className="mx-auto xl:px-20 px-8 max-w-7xl" {...props} />;
}
