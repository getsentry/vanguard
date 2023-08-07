import type { ComponentPropsWithoutRef } from "react";
import classNames from "~/lib/classNames";

export function Sidebar({
  showSidebar = false,
  children,
  ...props
}: ComponentPropsWithoutRef<"div"> & {
  showSidebar?: boolean;
}) {
  return (
    <>
      <div
        className={classNames(
          "fixed xl:right-0 xl:left-auto xl:w-[30rem] top-0 bottom-0 px-20 py-24 z-0",
          showSidebar
            ? "inset-0 z-20 bg-layer100-light dark:bg-layer100-dark"
            : "hidden xl:block",
        )}
        {...props}
      >
        {children}
        <div className="block absolute top-0 left-0 bottom-0 skew-x-6 -right-40 bg-layer100-light dark:bg-layer100-dark -z-10" />
      </div>
    </>
  );
}

export function SidebarSection(props: ComponentPropsWithoutRef<"div">) {
  return <div className="mb-10" {...props} />;
}
