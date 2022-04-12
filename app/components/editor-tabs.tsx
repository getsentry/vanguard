import React from "react";
import styled from "styled-components";
import { violet, mauve, blackA, green } from "@radix-ui/colors";
import * as TabsPrimitive from "@radix-ui/react-tabs";

const StyledTabs = styled(TabsPrimitive.Root)`
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px ${blackA.blackA4};
`;

const StyledList = styled(TabsPrimitive.List)`
  flex-shrink: 0;
  display: flex;
  border-bottom: 1px solid ${mauve.mauve6};
`;

const StyledTrigger = styled(TabsPrimitive.Trigger)`
  all: unset;
  font-family: inherit;
  background-color: white;
  padding: 0 20px;
  height: 45px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  line-height: 1;
  color: ${mauve.mauve11};
  user-select: none;

  &:first-child {
    border-top-left-radius: 6px;
  }

  &:last-child {
    border-top-right-radius: 6px;
  }

  &:hover {
    color: ${violet.violet11};
  }

  &[data-state="active"] {
    color: ${violet.violet11};
    box-shadow: inset 0 -1px 0 0 currentColor, 0 1px 0 0 currentColor;
  }

  &:focus {
    position: relative;
    box-shadow: 0 0 0 2px black;
  }
`;

const StyledContent = styled(TabsPrimitive.Content)`
  flex-grow: 1;
  padding: 20px;
  background-color: white;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  outline: none;
  &:focus {
    boxShadow: 0 0 0 2px black;
  },
`;

// Exports
export const Tabs = StyledTabs;
export const List = StyledList;
export const Trigger = StyledTrigger;
export const Content = StyledContent;
