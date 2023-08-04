import type { ComponentPropsWithoutRef } from "react";

export default function Block(props: ComponentPropsWithoutRef<"section">) {
  return <section style={{ margin: "30px 0" }} {...props} />;
}
