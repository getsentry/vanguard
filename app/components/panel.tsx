import type { ComponentPropsWithoutRef } from "react";

export function Panel({ ...props }: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      className="my-12 border border-border-light dark:border-border-dark py-6 px-6 rounded"
      {...props}
    />
  );
}

export function Title({ ...props }: ComponentPropsWithoutRef<"h6">) {
  return (
    <h6
      className="border-b border-border-light dark:border-border-dark bg-layer100-light dark:bg-layer100-dark p-6 -mt-6 -mx-6 mb-6 rounded-t"
      {...props}
    />
  );
}

export default Panel;
