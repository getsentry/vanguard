import React, { ButtonHTMLAttributes } from "react";

export type ButtonMode = "default" | "primary" | "danger";

export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  mode?: ButtonMode;
  size?: ButtonSize;
}

export function getButtonClassName({
  disabled,
  className,
  mode = "default",
  size = "md",
}: ButtonProps) {
  className = `${className || ""} btn btn-${size}`;

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

const Button: React.FC<ButtonProps> = function Button({
  children,
  disabled,
  className,
  mode = "default",
  size = "md",
  ...props
}) {
  className = getButtonClassName({ className, mode, size, disabled });

  return (
    <button disabled={disabled} className={className} {...props}>
      {children}
    </button>
  );
};

export default Button;
