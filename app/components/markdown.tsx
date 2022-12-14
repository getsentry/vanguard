import { marked } from "marked";
import { sanitize } from "isomorphic-dompurify";
import prismjs from "prismjs";
import { summarize as summarizeFn } from "../lib/summarize";

import "prism-sentry/index.css";

const renderer = new marked.Renderer();

renderer.code = function (code, lang, escaped) {
  code = this.options.highlight(code, lang);
  if (!lang) {
    return `<pre class="code-block"><code>${code}</code></pre>`;
  }

  var langClass = "language-" + lang;
  return `<pre class="code-block ${langClass}"><code class="${langClass}">${code}</code></pre>`;
};

// add captions to images
renderer.image = function (href, title, text) {
  const html = `<figure><img src="${href}" title="${title}" alt="${text}" /></figure>`;
  if (title) {
    return `<figure>
      ${html}
      <figcaption>${title}</figcaption>
      </figure>`;
  }
  return html;
};

const parseMarkdown = (content: string, options = {}): string => {
  return marked.parse(content, {
    renderer,
    highlight: function (code, lang) {
      if (prismjs.languages[lang]) {
        return prismjs.highlight(code, prismjs.languages[lang], lang);
      } else {
        return code;
      }
    },
    breaks: true,
    ...options,
  });
};

export default function Markdown({
  content,
  summarize,
  ...props
}: {
  content: string;
  summarize?: boolean;
}) {
  let html = sanitize(
    summarize ? summarizeFn(content) : parseMarkdown(content)
  );
  return <div dangerouslySetInnerHTML={{ __html: html }} {...props} />;
}
