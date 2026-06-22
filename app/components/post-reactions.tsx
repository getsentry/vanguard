import { PlusIcon } from "@radix-ui/react-icons";

import type { PostQueryType } from "~/models/post.server";
import Block from "~/components/block";
import EmojiReaction from "~/components/emoji-reaction";
import { useEffect, useMemo, useState } from "react";
import Picker from "~/components/emoji-picker";

// Persist a reaction toggle. Returns undefined on any failure so the caller can
// revert its optimistic update.
const toggleReaction = async (postId: string, emoji: string): Promise<number | undefined> => {
  try {
    const res = await fetch(`/api/posts/${postId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) return (await res.json()).delta;
  } catch {
    // handled below
  }
  alert("Unable to save reaction");
  return undefined;
};

export type EmojiData = {
  count: number;
  value: string;
  selected: boolean;
};

export default function PostReactions({
  post,
  reactions,
}: {
  post: PostQueryType;
  reactions: any[];
}) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const defaultEmojis = useMemo(
    () => (post.category.defaultEmojis.length ? post.category.defaultEmojis : ["❤️"]),
    [post.category.defaultEmojis],
  );

  const defaults = defaultEmojis.filter((d) => !reactions.find((r) => r.emoji === d));
  const initialEmojiList = [
    ...defaults.map((d) => ({ selected: false, count: 0, value: d })),
    ...reactions.map((r) => ({
      selected: !!r.user,
      count: r.total,
      value: r.emoji,
    })),
  ];
  initialEmojiList.sort((a, b) => b.count - a.count);
  const [emojiList, setEmojiList] = useState(initialEmojiList);

  useEffect(() => {
    const defaults = defaultEmojis.filter((d) => !reactions.find((r) => r.emoji === d));
    const initialEmojiList = [
      ...defaults.map((d) => ({ selected: false, count: 0, value: d })),
      ...reactions.map((r) => ({
        selected: !!r.user,
        count: r.total,
        value: r.emoji,
      })),
    ];

    initialEmojiList.sort((a, b) => b.count - a.count);

    setEmojiList(initialEmojiList);
  }, [reactions, defaultEmojis]);

  // dont show reactions if unpublished
  if (!post.published) return null;

  // Toggle one emoji in place — no re-sort, so the clicked button doesn't jump.
  // Self-inverse (applying it twice restores the original), which we reuse to
  // revert the optimistic update if the request fails.
  const toggleEmoji = (list: EmojiData[], value: string): EmojiData[] => {
    const existing = list.find((e) => e.value === value);
    if (!existing) return [...list, { value, count: 1, selected: true }];
    const selected = !existing.selected;
    const count = existing.count + (selected ? 1 : -1);
    // Drop to-zero emojis unless they're a category default (kept as a prompt).
    if (count <= 0 && !defaultEmojis.includes(value)) {
      return list.filter((e) => e.value !== value);
    }
    return list.map((e) => (e.value === value ? { value, count, selected } : e));
  };

  const onEmojiClick = (_event: any, value: string) => {
    // Update optimistically, then revert if the save fails.
    setEmojiList((list) => toggleEmoji(list, value));
    void toggleReaction(post.id, value).then((delta) => {
      if (delta === undefined) setEmojiList((list) => toggleEmoji(list, value));
    });
  };

  return (
    <Block className="print:hidden">
      <div className="flex flex-wrap gap-1">
        {emojiList.map((emoji) => {
          return (
            <EmojiReaction
              key={emoji.value}
              count={emoji.count}
              emoji={emoji.value}
              selected={emoji.selected}
              onClick={(e) => onEmojiClick(e, emoji.value)}
            />
          );
        })}
        <div className="relative z-50">
          <EmojiReaction emoji={<PlusIcon />} onClick={(_e) => setPickerVisible(!pickerVisible)} />
          <Picker
            open={pickerVisible}
            style={{ position: "absolute" }}
            onEmojiSelect={(e, emoji) => {
              onEmojiClick(e, emoji);
              setPickerVisible(false);
            }}
          />
        </div>
      </div>
    </Block>
  );
}
