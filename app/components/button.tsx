import type { ButtonHTMLAttributes } from "react";
import React from "react";

export type ButtonMode = "default" | "primary" | "danger";

export type ButtonSize = "xs" | "sm" | "md";

export type ButtonStyle = "button" | "link";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  mode?: ButtonMode;
  size?: ButtonSize;
  baseStyle?: ButtonStyle;
}

export function getButtonClassName({
  disabled,
  className,
  mode = "default",
  baseStyle = "button",
  size = "md",
}: ButtonProps) {
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

  return className;
}

interface OurButtonProps extends ButtonProps {
  size?: ButtonSize;
  baseStyle?: ButtonStyle;
  mode?: ButtonMode;
}

const Button: React.FC<OurButtonProps> = function Button({
  children,
  disabled,
  className,
  mode = "default",
  size = "md",
  baseStyle = "button",
  ...props
}) {
  className = getButtonClassName({
    className,
    mode,
    size,
    disabled,
    baseStyle,
  });

  return (
    <button disabled={disabled} className={className} {...props}>
      {children}
    </button>
  );
};

export default Button;
