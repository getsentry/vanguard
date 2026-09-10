import type { CSSProperties, ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import type { EmojiClickData } from "emoji-picker-react";

import { toShortcode } from "~/lib/emoji";
import { useSlackEmojis } from "~/lib/use-slack-emojis";

// emoji-picker-react v4 touches browser APIs at module init, so it can't be
// evaluated during SSR. Dynamically import on the client and render nothing
// until the module resolves.
type CustomEmoji = {
  names: string[];
  imgUrl: string;
  id: string;
};

type PickerProps = {
  open?: boolean;
  style?: CSSProperties;
  customEmojis?: CustomEmoji[];
  onEmojiClick?: (emojiData: EmojiClickData, event: MouseEvent) => void;
};

export default function EmojiPicker({
  onEmojiSelect,
  open,
  style,
}: {
  onEmojiSelect: (event: MouseEvent, emoji: string) => void;
  open?: boolean;
  style?: CSSProperties;
}) {
  const [Picker, setPicker] = useState<ComponentType<PickerProps> | null>(null);
  const slackEmojis = useSlackEmojis();

  const customEmojis = useMemo(
    () => slackEmojis.map(({ name, url }) => ({ names: [name], imgUrl: url, id: name })),
    [slackEmojis],
  );

  useEffect(() => {
    import("emoji-picker-react").then((mod) => {
      // Wrap in a factory so React's functional setter doesn't invoke the component.
      setPicker(() => mod.default as ComponentType<PickerProps>);
    });
  }, []);

  if (!Picker) return null;

  return (
    <Picker
      open={open}
      style={style}
      customEmojis={customEmojis}
      onEmojiClick={(emojiData, event) =>
        // Custom emoji have no codepoint, so store the Slack shortcode instead.
        onEmojiSelect(event, emojiData.isCustom ? toShortcode(emojiData.names[0]) : emojiData.emoji)
      }
    />
  );
}
