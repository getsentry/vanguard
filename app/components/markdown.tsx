import { marked } from "marked";
import { sanitize } from "isomorphic-dompurify";
import prismjs from "prismjs";
import { default as summarizeFn } from "../lib/summarize";
import { useState, useEffect, useRef } from "react";

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
    summarize ? summarizeFn(content) : parseMarkdown(content),
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
