import styled from "styled-components";

const EmojiButton = styled.button`
  background: ${(p) =>
    p.selected
      ? p.theme.emoji.selectedBackgroundColor
      : p.theme.emoji.defaultBackgroundColor};
  color: ${(p) =>
    p.selected
      ? p.theme.emoji.selectedTextColor
      : p.theme.emoji.defaultTextColor};

  border-radius: 3rem;
  display: block;
  padding: 0.6rem 0.8rem;
  border-radius: 0.4rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  font-family: "Lucida Sans Unicode", "Lucida Grande", "Arial Unicode MS",
    sans-serif;

  span {
    font-size: "IBM Plex Mono", "monospace";
  }

  &:hover {
    background: ${(p) => p.theme.emoji.highlightBackgroundColor};
    color: ${(p) => p.theme.emoji.highlightTextColor};
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
