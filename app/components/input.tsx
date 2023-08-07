import type { ComponentPropsWithoutRef } from "react";
import IconSearch from "~/icons/IconSearch";
import classNames from "~/lib/classNames";

export default function Input({
  variant,
  ...props
}: ComponentPropsWithoutRef<"input"> & {
  variant?: "search";
}) {
  return (
    <div
      className={classNames(
        "flex gap-x-2 focus-within:border-borderfocus-light dark:focus-within:border-borderfocus-dark outline:border-borderfocus-light dark:outline:border-borderfocus-dark items-center bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark py-2 px-3",
        variant === "search" ? "rounded-full" : "rounded-md",
      )}
    >
      {variant === "search" && (
        <div className="text-muted-light dark:text-muted-dark">
          <IconSearch height={20} />
        </div>
      )}
      <input
        className="flex-1 w-full bg-transparent placeholder:text-muted-light dark:placeholder:text-muted-dark outline-0 border-0 focus:ring-0"
        {...props}
      />
    </div>
  );
}
