import React, { useEffect, useState } from "react";

export default function EmojiPicker({
  onEmojiSelect,
  style,
  ...props
}: {
  onEmojiSelect: (event: Event, emoji: string) => void;
  style?: any;
}) {
  const [Component, setComponent] = useState<React.ReactNode | null>(null);

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
    <Component.default
      {...props}
      onEmojiClick={(e, obj) => onEmojiSelect(e, obj.emoji)}
      pickerStyle={style}
    />
  );
}
