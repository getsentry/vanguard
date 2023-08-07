import Container from "./container";
import type { ComponentPropsWithoutRef } from "react";

export default function FormActions({
  children,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className="fixed bg-layer100-light dark:bg-layer100-dark border-t border-border-light dark:border-border-dark py-4 bottom-0 right-0 left-0 z-10"
      {...props}
    >
      <div className="xl:mr-[35rem] text-right">
        <Container>{children}</Container>
      </div>
    </div>
  );
}
