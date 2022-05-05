import React, { ButtonHTMLAttributes } from "react";

export type ButtonMode = "default" | "primary" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  mode: ButtonMode;
}

export function getButtonClassName({
  disabled,
  className,
  mode = "default",
}: ButtonProps) {
  className = `${className || ""} btn`;

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
  ...props
}) {
  className = getButtonClassName({ className, mode, disabled });

  return (
    <button disabled={disabled} className={className} {...props}>
      {children}
    </button>
  );
};

export default Button;
