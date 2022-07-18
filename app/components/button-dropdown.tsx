import type { MouseEventHandler } from "react";
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import type { ButtonProps } from "./button";
import Button, { getButtonClassName } from "./button";
import { ChevronDownIcon } from "@radix-ui/react-icons";

const DropdownContent = styled.div`
  white-space: nowrap;
  background-color: white;
  box-shadow: 0px 10px 38px -10px rgba(22, 23, 24, 0.35),
    0px 10px 20px -15px rgba(22, 23, 24, 0.2);
  border-radius: 4px;
  position: absolute;
  bottom: 0;
  flex-direction: column;

  display: ${(props) => (props.open ? "flex" : "none")};
`;

const Dropdown = styled.div`
  position: relative;
`;

const ButtonCluster = styled.div`
  display: flex;

  button:first-child {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  button:last-child {
    border-left: 1px solid #ccc;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
`;

const DropdownTrigger = styled.button``;

export const ButtonDropdownItem = styled.button`
  all: unset;
  display: flex;
  flex-direction: column;
  text-align: left;
  padding: 0.5em 1em;
  position: relative;
  cursor: pointer;
  border-radius: 4px;

  &:first-child {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  &:last-child {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  &:focus,
  &:hover {
    color: #fff;
    background-color: #000;
  }
`;

const ButtonDropdown: React.FC<ButtonProps> = function ButtonDropdown({
  children,
  className,
  label,
  items,
  ...props
}) {
  const [isOpen, setOpen] = useState<boolean>(false);

  const toggleDropdown = (e: MouseEventHandler<HTMLElement>) => {
    e.preventDefault && e.preventDefault();
    setOpen(!isOpen);
  };

  const dropdownRef = useRef<HTMLElement>();

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
    <Dropdown ref={dropdownRef} open={isOpen}>
      <ButtonCluster>
        <Button className={className} {...props}>
          {label}
        </Button>
        <DropdownTrigger
          className={getButtonClassName({ className, ...props })}
          onClick={toggleDropdown}
        >
          <ChevronDownIcon width="16" height="16" />
        </DropdownTrigger>
      </ButtonCluster>

      <DropdownContent open={isOpen}>{children}</DropdownContent>
    </Dropdown>
  );
};

export default ButtonDropdown;
