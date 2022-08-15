import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";

const Picker = styled.div`
  .emoji-search {
    font-size: ;
    line-height: normal;
  }

  .emoji-picker-react {
    border-color: ${(p) => p.theme.borderColor};
  }
`;

export default ({
  onEmojiSelect,
  style,
  ...props
}: {
  onEmojiSelect: (event: Event, emoji: string) => void;
  style?: any;
}) => {
  const [Component, setComponent] = useState<React.ElementType | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("emoji-picker-react").then((_module) => {
        // XXX(dcramer): this isnt correct.. default seems to be the module
        // and if we set it to the component (using .default.default) it errors out{
        setComponent(_module.default);
      });
    }
  }, []);

  if (!Component) return null;

  return (
    <Picker>
      <Component.default
        {...props}
        onEmojiClick={(e, obj) => onEmojiSelect(e, obj.emoji)}
        pickerStyle={style}
      />
    </Picker>
  );
};
