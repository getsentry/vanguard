import { useEffect, useRef, useState } from "react";
import type { Props as ButtonProps } from "./button";
import Button from "./button";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import classNames from "~/lib/classNames";
import type { ComponentPropsWithoutRef, MouseEventHandler } from "react";

export function ButtonDropdownItem(props: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      className="flex flex-col text-left px-4 py-2 cursor-pointer relative rounded-md text-button-default-text-light dark:text-button-default-text-dark bg-button-default-bg-light dark:bg-button-default-bg-dark first:rounded-b-none last:rounded-t-none hover:text-button-primary-text-light dark:hover:text-button-primary-text-dark hover:bg-button-primary-bg-light dark:hover:bg-button-primary-bg-dark"
      {...props}
    />
  );
}

export default function ButtonDropdown({
  children,
  label,
  ...props
}: ButtonProps<"button"> & {
  label: string;
}) {
  const [isOpen, setOpen] = useState<boolean>(false);

  const toggleDropdown = (e: MouseEventHandler<HTMLButtonElement>) => {
    e.preventDefault && e.preventDefault();
    setOpen(!isOpen);
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: Event) => {
      if (e.target && !dropdownRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };

    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("click", handleClick);
    };
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex btn-dropdown">
        <Button {...props}>{label}</Button>
        <Button {...props} onClick={toggleDropdown}>
          <ChevronDownIcon width="16" height="16" />
        </Button>
      </div>

      <div
        className={classNames(
          "whitespace-nowrap text-primary-light dark:text-primary-dark bg-bg-light dark:bg-bg-dark shadow-lg rounded absolute bottom-0 flex-col",
          isOpen ? "flex" : "hidden",
        )}
      >
        {children}
      </div>
    </div>
  );
}
