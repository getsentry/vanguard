import { useNavigate } from "@remix-run/react";
import React, { ButtonHTMLAttributes } from "react";

interface ButtonLinkProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  to?: string;
}

const ButtonLink: React.FC<ButtonLinkProps> = function ButtonLink({
  to,
  children,
  disabled,
  className,
  ...props
}) {
  const navigate = useNavigate();
  const onClick = to ? () => navigate(to) : undefined;

  if (disabled) className = `${className} btn opacity-50 cursor-not-allowed`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
};

export default ButtonLink;
