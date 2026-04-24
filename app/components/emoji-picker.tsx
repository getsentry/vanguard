import React, { useEffect, useState } from "react";

// The emoji-picker-react v3 shipped with unusual default-export wrapping;
// the imported module's `.default` is itself a module whose `.default` is
// the actual component. We accept the double-default at the render site.
type EmojiPickerModule = {
  default: React.ComponentType<{
    onEmojiClick: (e: Event, obj: { emoji: string }) => void;
    pickerStyle?: React.CSSProperties;
  }>;
};

export default function EmojiPicker({
  onEmojiSelect,
  style,
  ...props
}: {
  onEmojiSelect: (event: Event, emoji: string) => void;
  style?: React.CSSProperties;
}) {
  const [mod, setMod] = useState<EmojiPickerModule | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("emoji-picker-react").then((_module) => {
        setMod(_module.default as unknown as EmojiPickerModule);
      });
    }
  }, []);

  if (!mod) return null;
  const Picker = mod.default;

  return (
    <Picker
      {...props}
      onEmojiClick={(e, obj) => onEmojiSelect(e, obj.emoji)}
      pickerStyle={style}
    />
  );
}
