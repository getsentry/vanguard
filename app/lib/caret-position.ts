// Textareas expose no API for "where is character N on screen", so we measure
// it the usual way: clone the textarea's type and box metrics into an offscreen
// div, put the text up to the caret in it, and read the position of a marker
// span. Only the properties that affect line wrapping are copied.
const MIRRORED_STYLES = [
  "boxSizing",
  "width",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "letterSpacing",
  "lineHeight",
  "textTransform",
  "textIndent",
  "wordSpacing",
  "whiteSpace",
  "wordBreak",
  "overflowWrap",
  "tabSize",
] as const;

export type CaretCoordinates = {
  /** Offsets relative to the textarea's own padding box, before scrolling. */
  top: number;
  left: number;
  height: number;
};

export function getCaretCoordinates(
  element: HTMLTextAreaElement,
  position: number,
): CaretCoordinates {
  const computed = window.getComputedStyle(element);

  const mirror = document.createElement("div");
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";
  MIRRORED_STYLES.forEach((name) => {
    mirror.style[name] = computed[name];
  });

  mirror.textContent = element.value.slice(0, position);

  // A zero-width marker: textContent alone has no measurable end position.
  const marker = document.createElement("span");
  marker.textContent = element.value.slice(position) || ".";
  mirror.appendChild(marker);

  document.body.appendChild(mirror);
  const top = marker.offsetTop + parseInt(computed.borderTopWidth, 10);
  const left = marker.offsetLeft + parseInt(computed.borderLeftWidth, 10);
  const height = parseInt(computed.lineHeight, 10) || element.clientHeight;
  document.body.removeChild(mirror);

  return { top, left, height };
}
