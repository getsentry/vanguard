import type { ComponentPropsWithoutRef } from "react";

export default function PageHeader({
  children,
  title,
  ...props
}: ComponentPropsWithoutRef<"div"> & {
  title?: string;
}) {
  return (
    <div className="mb-12 text-right" {...props}>
      {!!title && (
        <h1 className="float-left text-4xl font-serif font-medium">{title}</h1>
      )}
      {children}
      <div className="table clear-both" />
    </div>
  );
}
