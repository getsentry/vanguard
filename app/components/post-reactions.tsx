import styled from "styled-components";

import type { PostQueryType } from "~/models/post.server";
import Block from "~/components/block";
import EmojiReaction from "~/components/emoji-reaction";
import { useState } from "react";
import Picker from "~/components/emoji-picker";

const toggleReaction = async (
  postId: string,
  emoji: string
): Promise<number | undefined> => {
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
    return data.delta;
  } else {
    alert("Unable to save reaction");
  }
};

export type EmojiData = {
  count: number;
  value: string;
  selected: boolean;
};

const PickerContainer = styled.div`
  position: relative;
  display: block;
  z-index: 100;
`;

export default ({
  post,
  reactions,
}: {
  post: PostQueryType;
  reactions: any[];
}) => {
  // dont show reactions if unpublished
  if (!post.published) return null;

  const defaults = ["❤️", "🎉", "🚀"].filter(
    (d) => !reactions.find((r) => r.emoji === d)
  );

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

  const [pickerVisible, setPickerVisible] = useState(false);

  const onEmojiClick = async (_event: any, value: string) => {
    const delta = await toggleReaction(post.id, value);
    // undefined is an error
    if (delta === undefined) return;

    let newEmojiList: EmojiData[] = [];
    const existing = emojiList.find((e) => e.value === value);
    if (existing) {
      newEmojiList = emojiList.filter((e) => e.value !== value);
      console.log({ newEmojiList });
      const newItem = {
        value,
        count: existing.count + delta,
        selected: delta > 0,
      };
      if (newItem.count > 0 || defaults.indexOf(value) !== -1) {
        newEmojiList.push(newItem);
      }
    } else if (delta > 0) {
      newEmojiList = [...emojiList, { value, count: delta, selected: true }];
    }
    newEmojiList.sort((a, b) => b.count - a.count);
    setEmojiList(newEmojiList);
  };

  return (
    <Block>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
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
        <PickerContainer>
          <EmojiReaction
            emoji="☺ +"
            onClick={(e) => setPickerVisible(!pickerVisible)}
          />
          <Picker
            onEmojiSelect={(e, emoji) => {
              onEmojiClick(e, emoji);
              setPickerVisible(false);
            }}
            style={{
              // have to use visibility here or it breaks the category selector
              visibility: pickerVisible ? "visible" : "hidden",
              position: "absolute",
            }}
          />
        </PickerContainer>
      </div>
    </Block>
  );
};
