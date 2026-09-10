import { useState } from "react";

import classNames from "~/lib/classNames";
import { emojiImageUrl, shortcodeName } from "~/lib/emoji";

/**
 * Renders a stored reaction value: a unicode emoji as text, a Slack shortcode
 * as its image. The renderer has no emoji index of its own, so a shortcode the
 * workspace no longer has falls back to its literal text once the image 404s.
 */
export default function Emoji({ value, className }: { value: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  const name = shortcodeName(value);

  if (!name || broken) return <span className={className}>{value}</span>;

  return (
    <img
      src={emojiImageUrl(name)}
      alt={value}
      title={value}
      loading="lazy"
      onError={() => setBroken(true)}
      className={classNames("emoji", className)}
    />
  );
}
