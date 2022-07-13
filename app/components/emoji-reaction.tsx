import { useState } from "react";
import styled from "styled-components";

const EmojiButton = styled.button`
  background: ${(p) => (p.selected ? p.theme.borderColor : p.theme.bgColor)};
  border: 1px solid ${(p) => p.theme.borderColor};
  border-radius: 4px;
  display: block;
  font-family: "Inter", sans-serif;
  padding: 0.8rem 1.2rem;
  border-radius: 0.4rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  font-family: "IBM Plex Mono", monospace;
  color: ${(p) => p.theme.textMuted};

  &:hover {
    background: ${(p) => p.theme.borderColor};
  }
`;

const EmojiRection = ({
  postId,
  count,
  emoji,
  selected,
}: {
  postId: string;
  count: number;
  emoji: string;
  selected: boolean;
}) => {
  const [currentCount, setCount] = useState(count);
  const [currentSelected, setSelected] = useState(selected);

  return (
    <EmojiButton
      selected={currentSelected}
      onClick={async () => {
        const res = await fetch(`/api/posts/${postId}/reactions`, {
          method: "POST",
          body: JSON.stringify({
            emoji,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (res.status === 200) {
          const data = await res.json();
          setCount(currentCount + data.delta);
          setSelected(data.delta > 0);
        } else {
          alert("Unable to save reaction");
        }
      }}
    >
      {emoji}
      {currentCount ? ` ${currentCount}` : null}
    </EmojiButton>
  );
};

export default EmojiRection;
