import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
const { sanitize } = DOMPurify;

const WORDS_PER_MINUTE = 230;

/**
 * Renders the markdown and keeps only the text a reader sees, so embedded
 * SVG/math/scripts, image embeds, and link URLs don't count toward reading
 * time. Rendering first means tags mentioned inside code stay as plain text.
 */
const readableText = (content: string): string => {
  const dom = sanitize(marked.parse(content), {
    FORBID_TAGS: ["svg", "math", "style", "script"],
    RETURN_DOM: true,
  });
  return (dom.textContent || "").replace(/https?:\/\/\S+/g, " ");
};

export default (content: string, plural: boolean = true): string => {
  const words = readableText(content).match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  if (minutes < 60) return minutes + " minute" + (plural && minutes > 1 ? "s" : "");

  const hours = Math.round(minutes / 60);

  return hours + " hour" + (plural && hours > 1 ? "s" : "");
};
