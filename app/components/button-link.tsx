import { useNavigate } from "@remix-run/react";
import type { ButtonHTMLAttributes, MouseEvent } from "react";
import React from "react";
import Button from "./button";

interface ButtonLinkProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  to?: string;
}

const ButtonLink: React.FC<ButtonLinkProps> = function ButtonLink({
  to,
  children,
  onClick,
  ...props
}) {
  const navigate = useNavigate();
  const newOnClick = to
    ? (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        onClick && onClick(e);
        navigate(to);
      }
    : undefined;

  return (
    <Button onClick={newOnClick} {...props}>
      {children}
    </Button>
  );
};

export default ButtonLink;
