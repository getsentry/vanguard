import type { SVGProps } from "react";
import classNames from "~/lib/classNames";

export default function IconHamburger({
  showSidebar = false,
  ...props
}: SVGProps<SVGSVGElement> & {
  showSidebar?: boolean;
}) {
  const pathStyles = "origin-center ease-in-out duration-1000";
  return (
    <svg
      fill="none"
      viewBox="0 0 32 32"
      className={classNames(
        "absolute z-[1000] right-0 block xl:hidden cursor-pointer",
      )}
      {...props}
    >
      <path
        className={classNames(
          pathStyles,
          showSidebar ? "opacity-0 translate-y-1" : "opacity-100",
        )}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M5 9h22"
      />
      <path
        className={classNames(pathStyles, showSidebar ? "-rotate-45" : "")}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M5 16h22"
      />
      <path
        className={classNames(pathStyles, showSidebar ? "rotate-45" : "")}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M5 16h22"
      />
      <path
        className={classNames(
          pathStyles,
          showSidebar ? "opacity-0 -translate-y-1" : "opacity-100",
        )}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M5 23h22"
      />
    </svg>
  );
}
