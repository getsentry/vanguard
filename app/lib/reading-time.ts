const WORDS_PER_MINUTE = 230;

/**
 * Strips everything a reader doesn't read (embedded SVG/HTML, image embeds,
 * link URLs) from markdown so only visible words count toward reading time.
 */
const readableText = (content: string): string => {
  return content
    .replace(/<(svg|math|style|script)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ");
};

export default (content: string, plural: boolean = true): string => {
  const words = readableText(content).match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  if (minutes < 60) return minutes + " minute" + (plural && minutes > 1 ? "s" : "");

  const hours = Math.round(minutes / 60);

  return hours + " hour" + (plural && hours > 1 ? "s" : "");
};
