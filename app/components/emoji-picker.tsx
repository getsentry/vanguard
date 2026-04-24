import type { CSSProperties, ComponentType } from "react";
import { useEffect, useState } from "react";
import type { EmojiClickData } from "emoji-picker-react";

// emoji-picker-react v4 touches browser APIs at module init, so it can't be
// evaluated during SSR. Dynamically import on the client and render nothing
// until the module resolves.
type PickerProps = {
  style?: CSSProperties;
  onEmojiClick?: (emojiData: EmojiClickData, event: MouseEvent) => void;
};

export default function EmojiPicker({
  onEmojiSelect,
  style,
}: {
  onEmojiSelect: (event: MouseEvent, emoji: string) => void;
  style?: CSSProperties;
}) {
  const [Picker, setPicker] = useState<ComponentType<PickerProps> | null>(null);

  useEffect(() => {
    import("emoji-picker-react").then((mod) => {
      // Wrap in a factory so React's functional setter doesn't invoke the component.
      setPicker(() => mod.default as ComponentType<PickerProps>);
    });
  }, []);

  if (!Picker) return null;

  return (
    <Picker
      style={style}
      onEmojiClick={(emojiData, event) => onEmojiSelect(event, emojiData.emoji)}
    />
  );
}
