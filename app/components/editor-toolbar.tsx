import * as ToolbarPrimitive from "@radix-ui/react-toolbar";
import styled, { css } from "styled-components";
import { violet, mauve } from "@radix-ui/colors";

const StyledToolbar = styled(ToolbarPrimitive.Root)`
  display: flex;
  padding: 10px;
  width: 100%;
  min-width: max-content;
  border-radius: 6px 6px 0 0;
  background-color: ${(p) => p.theme.bgColor};
  border: 1px solid ${(p) => p.theme.borderColor};
  border-bottom: 0;
`;

const itemStyles = css`
  all: unset;
  flex: 0 0 auto;
  color: ${mauve.mauve11};
  height: 25px;
  padding: 0 5px;
  border-radius: 4px;
  display: inline-flex;
  font-size: 13px;
  line-height: 1;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${violet.violet3};
    color: ${violet.violet11};
  }

  &:focus {
    position: relative;
    box-shadow: 0 0 0 2px ${violet.violet7};
  }
`;

const StyledButton = styled(ToolbarPrimitive.Button)`
  ${itemStyles}
  background-color: ${(p) => p.theme.bgColor};
`;

const StyledLink = styled(ToolbarPrimitive.Link)`
  ${itemStyles}
  background-color: transparent;
  color: ${(p) => p.theme.textMuted};
  display: inline-flex;
  justify-content: center;
  align-items: center;
`;

const StyledSeparator = styled(ToolbarPrimitive.Separator)`
  width: 1px;
  background-color: ${(p) => p.theme.borderColor};
  margin: 0 10px;
`;

const StyledToggleGroup = styled(ToolbarPrimitive.ToggleGroup)`
  display: inline-flex;
  border-radius: 4px;
`;

const StyledToggleItem = styled(ToolbarPrimitive.ToggleItem)`
  ${itemStyles}
  box-shadow: 0;
  background-color: ${(p) => p.theme.bgColor};
  margin-left: 2px;

  &:first-child {
    margin-left: 0;
  }

  &[data-state="on"] {
    background-color: ${(p) => p.theme.bgLayer100};
    color: ${violet.violet11};
    border: 0;
  }
`;

export const Toolbar = StyledToolbar;
export const Button = StyledButton;
export const Separator = StyledSeparator;
export const Link = StyledLink;
export const ToggleGroup = StyledToggleGroup;
export const ToggleItem = StyledToggleItem;
