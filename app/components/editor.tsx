import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ClipboardEvent, DragEvent } from "react";
import TextareaAutosize from "react-textarea-autosize";
import toast from "react-hot-toast";
import {
  CodeIcon,
  FontBoldIcon,
  FontItalicIcon,
  ImageIcon,
  Link1Icon,
  ListBulletIcon,
  QuoteIcon,
  StrikethroughIcon,
} from "@radix-ui/react-icons";
import * as Tabs from "@radix-ui/react-tabs";
import * as Toolbar from "@radix-ui/react-toolbar";

import Content from "./content";
import Markdown from "./markdown";

// --- Minimal in-house markdown-textarea helpers ------------------------
//
// We used to lean on `textarea-markdown-editor` for these, but it's been
// unmaintained since 2022 and is CJS-only — which breaks Vite's ESM
// interop (the `.Wrapper` it attaches to its default export after load
// goes missing). Since we only use a thin slice (wrap selection, prefix
// lines, insert-at-cursor, replace-substring) it's cleaner to own it.

/**
 * Set a textarea's value via the native setter so React's synthetic-event
 * system still sees the change through the `onChange` handler. Same
 * technique React Testing Library uses for `fireEvent.change`.
 */
function setTextareaValue(el: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Wrap the current selection (or a placeholder) with `before` / `after`. */
function wrapSelection(el: HTMLTextAreaElement, before: string, after: string, placeholder = "") {
  const { selectionStart: s, selectionEnd: e, value } = el;
  const selected = value.slice(s, e) || placeholder;
  setTextareaValue(el, value.slice(0, s) + before + selected + after + value.slice(e));
  const start = s + before.length;
  const end = start + selected.length;
  el.focus();
  el.setSelectionRange(start, end);
}

/**
 * Toggle a line prefix (`- `, `> `, …) for every line touched by the
 * current selection. If every line already starts with the prefix, strip
 * it; otherwise apply it.
 */
function prefixLines(el: HTMLTextAreaElement, prefix: string, placeholder = "") {
  const { selectionStart: s, selectionEnd: e, value } = el;
  const lineStart = value.lastIndexOf("\n", s - 1) + 1;
  const nextNl = value.indexOf("\n", e);
  const lineEnd = nextNl === -1 ? value.length : nextNl;
  const block = value.slice(lineStart, lineEnd) || placeholder;
  const allPrefixed = block.split("\n").every((l) => l.startsWith(prefix));
  const replaced = block
    .split("\n")
    .map((l) => (allPrefixed ? l.slice(prefix.length) : prefix + l))
    .join("\n");
  setTextareaValue(el, value.slice(0, lineStart) + replaced + value.slice(lineEnd));
  el.focus();
  const delta = replaced.length - (lineEnd - lineStart);
  el.setSelectionRange(lineStart, e + delta);
}

/** Insert `[text](url)`, selecting the url placeholder for the user to type over. */
function insertLink(el: HTMLTextAreaElement) {
  const { selectionStart: s, selectionEnd: e, value } = el;
  const text = value.slice(s, e) || "text";
  const urlPlaceholder = "url";
  const before = `[${text}](`;
  const after = ")";
  setTextareaValue(el, value.slice(0, s) + before + urlPlaceholder + after + value.slice(e));
  const urlStart = s + before.length;
  el.focus();
  el.setSelectionRange(urlStart, urlStart + urlPlaceholder.length);
}

/** Insert text at the cursor (replacing any selection). */
function insertAtCursor(el: HTMLTextAreaElement, text: string) {
  const { selectionStart: s, selectionEnd: e, value } = el;
  setTextareaValue(el, value.slice(0, s) + text + value.slice(e));
  const caret = s + text.length;
  el.focus();
  el.setSelectionRange(caret, caret);
}

/** Replace the first occurrence of `from` in the textarea's value with `to`. */
function replaceInValue(el: HTMLTextAreaElement, from: string, to: string) {
  const idx = el.value.indexOf(from);
  if (idx === -1) return;
  setTextareaValue(el, el.value.slice(0, idx) + to + el.value.slice(idx + from.length));
}

const CODE_BLOCK_PLACEHOLDER = "function helloWorld() { }";

const commands = {
  bold: (el: HTMLTextAreaElement) => wrapSelection(el, "**", "**"),
  italic: (el: HTMLTextAreaElement) => wrapSelection(el, "_", "_"),
  "strike-through": (el: HTMLTextAreaElement) => wrapSelection(el, "~~", "~~"),
  "code-block": (el: HTMLTextAreaElement) =>
    wrapSelection(el, "```\n", "\n```", CODE_BLOCK_PLACEHOLDER),
  "unordered-list": (el: HTMLTextAreaElement) => prefixLines(el, "- "),
  "block-quotes": (el: HTMLTextAreaElement) => prefixLines(el, "> ", "quote"),
  link: insertLink,
} as const;

// --- Image upload ------------------------------------------------------

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/upload-image", {
    method: "POST",
    body: formData,
  });

  return await res.json();
}

function handleUploadImages(el: HTMLTextAreaElement, files: File[]) {
  files.forEach(async (file) => {
    const loadingText = `![Uploading ${file.name}...]()`;

    insertAtCursor(el, loadingText);

    try {
      const uploaded = await uploadImage(file);
      replaceInValue(el, loadingText, `![${uploaded.originalFilename}](${uploaded.url})`);
    } catch (err: any) {
      console.error(err);
      replaceInValue(el, loadingText, "");
      toast.error(`Error while saving image: ${err}`);
      throw err;
    }
  });
}

const onUploadFiles = (
  el: HTMLTextAreaElement,
  event:
    | DragEvent<HTMLTextAreaElement>
    | ClipboardEvent<HTMLTextAreaElement>
    | ChangeEvent<HTMLInputElement>,
  fileList: FileList | null,
) => {
  if (!fileList) return;

  const images = Array.from(fileList).filter((file) => /image/i.test(file.type));
  if (images.length === 0) return;

  event.preventDefault();
  handleUploadImages(el, images);
};

// --- Editor component --------------------------------------------------

function Editor({
  name,
  defaultValue,
  minRows = 15,
  noPreview,
}: {
  name: string;
  defaultValue?: string;
  minRows?: number;
  noPreview?: boolean;
}) {
  const [value, setValue] = useState(defaultValue || "");

  useEffect(() => {
    setValue(defaultValue || "");
  }, [defaultValue]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const run = (cmd: keyof typeof commands) => () => {
    if (textareaRef.current) commands[cmd](textareaRef.current);
  };

  const editorBlock = (
    <>
      <Toolbar.Toolbar className="editor-toolbar" aria-label="Formatting options">
        <Toolbar.Button value="bold" aria-label="Bold" onClick={run("bold")}>
          <FontBoldIcon />
        </Toolbar.Button>
        <Toolbar.Button value="italic" aria-label="Italic" onClick={run("italic")}>
          <FontItalicIcon />
        </Toolbar.Button>
        <Toolbar.Button
          value="strikethrough"
          aria-label="Strike through"
          onClick={run("strike-through")}
        >
          <StrikethroughIcon />
        </Toolbar.Button>
        <Toolbar.Separator />
        <Toolbar.Button
          value="unordered-list"
          aria-label="Unordered List"
          onClick={run("unordered-list")}
        >
          <ListBulletIcon />
        </Toolbar.Button>
        <Toolbar.Button value="code-block" aria-label="code-block" onClick={run("code-block")}>
          <CodeIcon />
        </Toolbar.Button>
        <Toolbar.Button
          value="block-quotes"
          aria-label="block-quotes"
          onClick={run("block-quotes")}
        >
          <QuoteIcon />
        </Toolbar.Button>
        <Toolbar.Separator />
        <Toolbar.Button value="link" aria-label="Link" onClick={run("link")}>
          <Link1Icon />
        </Toolbar.Button>
        <Toolbar.Button value="image" aria-label="image" onClick={() => fileRef.current?.click()}>
          <ImageIcon />
        </Toolbar.Button>
      </Toolbar.Toolbar>

      <TextareaAutosize
        ref={textareaRef}
        name={name}
        minRows={minRows}
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPaste={(event) => {
          if (textareaRef.current) {
            onUploadFiles(textareaRef.current, event, event.clipboardData.files);
          }
        }}
        onDrop={(event) => {
          if (textareaRef.current) {
            onUploadFiles(textareaRef.current, event, event.dataTransfer.files);
          }
        }}
      />
    </>
  );

  return (
    <div className="editor">
      {noPreview ? (
        editorBlock
      ) : (
        <Tabs.Tabs defaultValue="edit" className="editor-tabs">
          <Tabs.List>
            <Tabs.Trigger value="edit">Edit</Tabs.Trigger>
            <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="edit">{editorBlock}</Tabs.Content>
          <Tabs.Content value="preview">
            <input type="hidden" name={name} value={value} />
            <Content>
              <Markdown content={value} />
            </Content>
          </Tabs.Content>
        </Tabs.Tabs>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          if (textareaRef.current) {
            onUploadFiles(textareaRef.current, event, event.target.files);
          }
          if (fileRef.current) fileRef.current.value = "";
        }}
        style={{ display: "none", position: "absolute", left: -100000 }}
      />
    </div>
  );
}

export default Editor;
