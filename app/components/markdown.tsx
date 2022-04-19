import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import prismjs from "prismjs";

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

marked.setOptions({
  renderer,
  highlight: function (code, lang) {
    if (prismjs.languages[lang]) {
      return prismjs.highlight(code, prismjs.languages[lang], lang);
    } else {
      return code;
    }
  },
});

export default function Markdown({
  content,
  summarize,
}: {
  content: string;
  summarize: boolean;
}) {
  const markdownContent = marked.parse(content, { breaks: true });
  let html = DOMPurify.sanitize(
    summarize ? markdownContent.split("</p>")[0] + "</p>" : markdownContent
  );
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
