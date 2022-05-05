import { useNavigate } from "@remix-run/react";
import React, { ButtonHTMLAttributes } from "react";
import Button from "./button";

interface ButtonLinkProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  to?: string;
}

const ButtonLink: React.FC<ButtonLinkProps> = function ButtonLink({
  to,
  children,
  ...props
}) {
  const navigate = useNavigate();
  const onClick = to ? () => navigate(to) : undefined;

  return (
    <Button onClick={onClick} {...props}>
      {children}
    </Button>
  );
};

export default ButtonLink;
