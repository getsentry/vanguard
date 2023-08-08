import type { ComponentPropsWithoutRef } from "react";

export default function PageHeader({
  children,
  title,
  ...props
}: ComponentPropsWithoutRef<"div"> & {
  title?: string;
}) {
  return (
    <div className="mb-12 flex items-right flex-nowrap" {...props}>
      {!!title && (
        <h1 className="text-4xl flex-1 font-serif font-medium">{title}</h1>
      )}
      {children}
    </div>
  );
}
