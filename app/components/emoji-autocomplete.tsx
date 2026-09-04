import type { KeyboardEvent, RefObject } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getCaretCoordinates } from "~/lib/caret-position";
import classNames from "~/lib/classNames";
import { toShortcode } from "~/lib/emoji";
import type { SlackEmojiItem } from "~/lib/use-slack-emojis";
import { useSlackEmojis } from "~/lib/use-slack-emojis";

const MAX_RESULTS = 8;

// Slack opens its own typeahead at two characters, which keeps a bare ":" in
// prose (a time, a ratio, a URL) from popping a menu over the text.
const MIN_QUERY_LENGTH = 2;

// The ":" must start a word, so "10:30" and "https://x" never trigger.
const QUERY_PATTERN = /(?:^|[\s([{>])(:([a-z0-9_+'-]{1,100}))$/i;

type Trigger = {
  query: string;
  /** Index of the ":" that opened the query. */
  start: number;
};

function findTrigger(el: HTMLTextAreaElement): Trigger | null {
  if (el.selectionStart !== el.selectionEnd) return null;
  const match = QUERY_PATTERN.exec(el.value.slice(0, el.selectionStart));
  if (!match) return null;
  return {
    query: match[2].toLowerCase(),
    start: el.selectionStart - match[1].length,
  };
}

function rank(emojis: SlackEmojiItem[], query: string): SlackEmojiItem[] {
  const matches = emojis.filter((emoji) => emoji.name.includes(query));
  // Prefix matches first, then shortest name: typing "par" should offer
  // "parrot" before "party-parrot-dance".
  matches.sort((a, b) => {
    const aPrefix = a.name.startsWith(query);
    const bPrefix = b.name.startsWith(query);
    if (aPrefix !== bPrefix) return aPrefix ? -1 : 1;
    if (a.name.length !== b.name.length) return a.name.length - b.name.length;
    return a.name.localeCompare(b.name);
  });
  return matches.slice(0, MAX_RESULTS);
}

/**
 * A Slack-style `:shortcode` typeahead for a textarea. Returns the popup to
 * render next to the textarea plus the handlers the textarea has to call, so
 * the caller keeps ownership of its own value state.
 */
export function useEmojiAutocomplete(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  { onInsert }: { onInsert: (el: HTMLTextAreaElement, start: number, text: string) => void },
) {
  const emojis = useSlackEmojis();
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [active, setActive] = useState(0);

  const results = useMemo(
    () => (trigger && trigger.query.length >= MIN_QUERY_LENGTH ? rank(emojis, trigger.query) : []),
    [emojis, trigger],
  );

  const open = results.length > 0;

  const close = useCallback(() => setTrigger(null), []);

  const refresh = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const next = findTrigger(el);
    setTrigger(next);
    setActive(0);
    if (next) {
      const caret = getCaretCoordinates(el, el.selectionStart);
      setPosition({ top: caret.top + caret.height - el.scrollTop, left: caret.left });
    }
  }, [textareaRef]);

  const select = useCallback(
    (emoji: SlackEmojiItem) => {
      const el = textareaRef.current;
      if (!el || !trigger) return;
      // A trailing space matches Slack: you keep typing, not fighting the caret.
      onInsert(el, trigger.start, `${toShortcode(emoji.name)} `);
      close();
    },
    [close, onInsert, textareaRef, trigger],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!open) return;
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setActive((i) => (i + 1) % results.length);
          break;
        case "ArrowUp":
          event.preventDefault();
          setActive((i) => (i - 1 + results.length) % results.length);
          break;
        case "Enter":
        case "Tab":
          event.preventDefault();
          select(results[active]);
          break;
        case "Escape":
          event.preventDefault();
          close();
          break;
        default:
          break;
      }
    },
    [active, close, open, results, select],
  );

  // The caret can move without the textarea firing change or keydown (a click,
  // a scroll), and the popup must not linger somewhere it no longer belongs.
  useEffect(() => {
    if (!open) return;
    const onScroll = () => close();
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [close, open]);

  const popup = open ? (
    <ul
      className="emoji-autocomplete"
      style={{ top: position.top, left: position.left }}
      role="listbox"
      aria-label="Emoji suggestions"
    >
      {results.map((emoji, index) => (
        <li key={emoji.name} role="option" aria-selected={index === active}>
          <button
            type="button"
            className={classNames(index === active && "is-active")}
            // mousedown, not click: click fires after the textarea has already
            // lost focus and reset its selection.
            onMouseDown={(event) => {
              event.preventDefault();
              select(emoji);
            }}
            onMouseEnter={() => setActive(index)}
          >
            <img src={emoji.url} alt="" loading="lazy" />
            <span>:{emoji.name}:</span>
          </button>
        </li>
      ))}
    </ul>
  ) : null;

  return { popup, onKeyDown, refresh, close, open };
}
