import type { ElementType } from "react";
import type { PolymorphicProps } from "~/types";

export type ButtonMode = "default" | "primary" | "danger";

export type ButtonSize = "xs" | "sm" | "md";

export type ButtonStyle = "button" | "link";

export type Props<E extends ElementType> = PolymorphicProps<E> & {
  mode?: ButtonMode;
  size?: ButtonSize;
  baseStyle?: ButtonStyle;
};

const defaultElement = "button";

export default function Button<E extends ElementType = typeof defaultElement>({
  as,
  disabled,
  className,
  mode = "default",
  baseStyle = "button",
  size = "md",
  ...props
}: Props<E>) {
  const Component = as ?? defaultElement;

  className = `${className || ""} btn-${size}`;

  switch (baseStyle) {
    case "link":
      className = `${className} btn-link`;
      break;
    case "button":
      className = `${className} btn `;
      break;
  }

  switch (mode) {
    case "primary":
      className = `${className} btn-primary`;
      break;
    case "danger":
      className = `${className} btn-danger`;
      break;
    default:
      className = `${className} bg-white text-gray-800 border border-gray-400`;
  }

  if (disabled) className = `${className} opacity-50 cursor-not-allowed`;

  return <Component disabled={disabled} className={className} {...props} />;
}
