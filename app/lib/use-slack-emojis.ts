import { useEffect, useState } from "react";

export type SlackEmojiItem = {
  name: string;
  url: string;
};

// The workspace emoji list is the same for every user and every page, so fetch
// it at most once per document and share the promise. Failures resolve to an
// empty list: custom emoji are an enhancement, never a reason to break a form.
let pending: Promise<SlackEmojiItem[]> | null = null;

export function loadSlackEmojis(): Promise<SlackEmojiItem[]> {
  if (!pending) {
    pending = fetch("/api/emoji")
      .then((res) => (res.ok ? res.json() : { emojis: [] }))
      .then((data) => (data.emojis ?? []) as SlackEmojiItem[])
      .catch(() => []);
  }
  return pending;
}

/** Workspace custom emoji, empty until the fetch resolves (and on failure). */
export function useSlackEmojis(): SlackEmojiItem[] {
  const [emojis, setEmojis] = useState<SlackEmojiItem[]>([]);

  useEffect(() => {
    let active = true;
    loadSlackEmojis().then((list) => {
      if (active) setEmojis(list);
    });
    return () => {
      active = false;
    };
  }, []);

  return emojis;
}
