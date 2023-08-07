import type { ComponentPropsWithoutRef } from "react";
import classNames from "~/lib/classNames";

export function EmojiButton({
  selected,
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  selected?: boolean;
}) {
  return (
    <button
      className={classNames(
        selected
          ? "bg-emoji-selected-bg-light dark:bg-emoji-selected-bg-dark"
          : "text-emoji-default-text-light dark:text-emoji-default-text-dark",
        "hover:text-emoji-highlight-text-light dark:hover:text-emoji-highlight-text-dark",
        "hover:bg-emoji-highlight-bg-light dark:hover:bg-emoji-highlight-bg-dark",
        "rounded-md px-3 py-2 inline-flex items-center font-serif gap-1",
      )}
      {...props}
    />
  );
}

export default function EmojiReaction({
  count = 0,
  emoji,
  selected,
  onClick,
}: {
  count?: number;
  emoji: string;
  selected?: boolean;
  onClick: any;
}) {
  return (
    <EmojiButton selected={selected} onClick={onClick}>
      {emoji}
      {count > 0 && <span className="font-mono">{count}</span>}
    </EmojiButton>
  );
}
