import styled from "styled-components";

const EmojiButton = styled.button`
  background: ${(p) => p.theme.bgColor};
  border: 1px solid
    ${(p) => (p.selected ? p.theme.linkColor : p.theme.borderColor)};
  border-radius: 4px;
  display: block;
  padding: 0.6rem 0.8rem;
  border-radius: 0.4rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  font-family: "Lucida Sans Unicode", "Lucida Grande", "Arial Unicode MS",
    sans-serif;
  color: ${(p) => (p.selected ? p.theme.linkColor : p.theme.color)};

  span {
    font-size: "IBM Plex Mono", "monospace";
  }

  &:hover {
    background: ${(p) => p.theme.borderColor};
    border: 1px solid ${(p) => p.theme.borderFocusColor};
  }
`;

const EmojiReaction = ({
  count,
  emoji,
  selected,
  onClick,
}: {
  count?: number;
  emoji: string;
  selected?: boolean;
  onClick: Function;
}) => {
  return (
    <EmojiButton selected={selected} onClick={onClick}>
      {emoji}
      <span>{count ? ` ${count}` : null}</span>
    </EmojiButton>
  );
};

export default EmojiReaction;
