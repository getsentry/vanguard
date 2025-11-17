import { sanitize } from "isomorphic-dompurify";
import { marked } from "marked";
import prismjs from "prismjs";
import { useEffect, useRef, useState } from "react";
import { default as summarizeFn } from "../lib/summarize";

import "prism-sentry/index.css";

// Load Prism.js languages
// Note: Load dependencies first (clike, c) before languages that extend them
// Order matters: clike -> c -> objectivec
import "prismjs/components/prism-bash";
import "prismjs/components/prism-c";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-css";
import "prismjs/components/prism-diff";
import "prismjs/components/prism-git";
import "prismjs/components/prism-go";
import "prismjs/components/prism-java";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-objectivec";
import "prismjs/components/prism-python";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-shell-session";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-swift";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-yaml";

const renderer = new marked.Renderer();

renderer.code = function (code, lang, escaped) {
  code = this.options.highlight(code, lang);
  if (!lang) {
    return `<pre class="code-block"><code>${code}</code></pre>`;
  }

  var langClass = "language-" + lang;
  return `<pre class="code-block ${langClass}"><code class="${langClass}">${code}</code></pre>`;
};

// add captions to images with enlargeable functionality
renderer.image = function (href, title, text) {
  const imgId = `img-${Math.random().toString(36).substr(2, 9)}`;
  const html = `<img
    id="${imgId}"
    src="${href}"
    title="${title || ""}"
    alt="${text}"
    class="markdown-image cursor-pointer hover:opacity-80 transition-opacity max-w-full h-auto rounded-lg shadow-sm"
    data-enlarge-src="${href}"
    data-enlarge-alt="${title || text || ""}"
  />`;

  if (title) {
    return `<figure class="not-prose markdown-figure my-6">
      ${html}
      <figcaption class="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center italic">${title}</figcaption>
    </figure>`;
  }
  return `<figure class="not-prose markdown-figure my-6">${html}</figure>`;
};

// Language aliases mapping
const languageAliases: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  rb: "ruby",
  sh: "bash",
  zsh: "bash",
  yml: "yaml",
  md: "markdown",
  html: "markup",
  xml: "markup",
  svg: "markup",
  mathml: "markup",
  objc: "objectivec",
};

const parseMarkdown = (content: string, options = {}): string => {
  return marked.parse(content, {
    renderer,
    highlight: function (code, lang) {
      if (!lang) {
        return code;
      }

      // Normalize language name (handle aliases and case)
      const normalizedLang =
        languageAliases[lang.toLowerCase()] || lang.toLowerCase();

      // Check if language is loaded
      if (prismjs.languages[normalizedLang]) {
        try {
          return prismjs.highlight(
            code,
            prismjs.languages[normalizedLang],
            normalizedLang
          );
        } catch (error) {
          console.warn(
            `Prism.js highlighting failed for language "${normalizedLang}":`,
            error
          );
          return code;
        }
      }

      // Fallback: try original language name
      if (lang !== normalizedLang && prismjs.languages[lang]) {
        try {
          return prismjs.highlight(code, prismjs.languages[lang], lang);
        } catch (error) {
          console.warn(
            `Prism.js highlighting failed for language "${lang}":`,
            error
          );
        }
      }

      return code;
    },
    breaks: true,
    ...options,
  });
};

// Image Modal Component
function ImageModal({
  src,
  alt,
  isOpen,
  onClose,
}: {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative w-full max-w-[95vw] max-h-full flex items-center justify-center">
        <img
          src={src}
          alt={alt}
          className="w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
          title="Close (Esc)"
        >
          ×
        </button>
        {alt && (
          <div className="absolute bottom-4 left-4 right-4 text-white text-center bg-black bg-opacity-70 rounded px-4 py-3 text-sm">
            {alt}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Markdown({
  content,
  summarize,
  ...props
}: {
  content: string;
  summarize?: boolean;
}) {
  const [modalImage, setModalImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Add click listeners to images after component mounts
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleImageClick = (event: Event) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === "IMG" &&
        target.classList.contains("markdown-image")
      ) {
        const src = target.getAttribute("data-enlarge-src");
        const alt = target.getAttribute("data-enlarge-alt");
        if (src) {
          setModalImage({ src, alt: alt || "" });
        }
      }
    };

    container.addEventListener("click", handleImageClick);

    return () => {
      container.removeEventListener("click", handleImageClick);
    };
  }, [content]); // Re-run when content changes

  let html = sanitize(
    summarize ? summarizeFn(content) : parseMarkdown(content)
  );

  return (
    <>
      <div
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: html }}
        {...props}
      />
      <ImageModal
        src={modalImage?.src || ""}
        alt={modalImage?.alt || ""}
        isOpen={!!modalImage}
        onClose={() => setModalImage(null)}
      />
    </>
  );
}
