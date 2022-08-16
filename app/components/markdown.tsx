import { marked } from "marked";
import { sanitize } from "isomorphic-dompurify";
import prismjs from "prismjs";

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
  highlight: (code, lang) => {
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

  let html = sanitize(
    summarize
      ? sanitize(marked.parse(content, { breaks: true }), {
          ALLOWED_TAGS: ["p", "blockquote", "#text"],
          KEEP_CONTENT: false,
        }).split("</p>")[0] + "</p>"
      : markdownContent
  );
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
