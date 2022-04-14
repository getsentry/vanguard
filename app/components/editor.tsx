import React, { ChangeEvent, useRef, useState } from "react";
import type { ClipboardEvent, DragEvent } from "react";
import TextareaAutosize from "react-textarea-autosize";
import TextareaMarkdown, { Cursor } from "textarea-markdown-editor";
import type {
  CommandHandler,
  TextareaMarkdownRef,
} from "textarea-markdown-editor";
import styled from "styled-components";
import toast from "react-hot-toast";
import {
  StrikethroughIcon,
  FontBoldIcon,
  FontItalicIcon,
  Link1Icon,
  ImageIcon,
  CodeIcon,
  QuoteIcon,
  ListBulletIcon,
} from "@radix-ui/react-icons";

import Content from "./content";
import * as Toolbar from "./editor-toolbar";
import * as Tabs from "./editor-tabs";
import Markdown from "./markdown";

function replaceText(cursor: Cursor, text: string, replaceWith: string) {
  cursor.setText(cursor.getText().replace(text, replaceWith));
}

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/upload-image", {
    method: "POST",
    body: formData,
  });

  return await res.json();
}

function handleUploadImages(textareaEl: HTMLTextAreaElement, fileList: File[]) {
  const cursor = new Cursor(textareaEl);
  const currentLineNumber = cursor.getCurrentPosition().lineNumber;

  fileList.forEach(async (file, idx) => {
    const loadingText = `![Uploading ${file.name}...]()`;

    cursor.spliceContent(Cursor.raw`${loadingText}${Cursor.$}`, {
      startLineNumber: currentLineNumber + idx,
    });

    try {
      const uploadedImage = await uploadImage(file);

      replaceText(
        cursor,
        loadingText,
        `![${uploadedImage.originalFilename}](${uploadedImage.url})`
      );
    } catch (err: any) {
      console.error(err);
      replaceText(cursor, loadingText, "");
      toast.error(`Error while saving image: ${err}`);
      throw err;
    }
  });
}

const onUploadFiles = (
  textareaEl: HTMLTextAreaElement,
  event:
    | DragEvent<HTMLTextAreaElement>
    | ClipboardEvent<HTMLTextAreaElement>
    | ChangeEvent<HTMLInputElement>,
  fileList: FileList | null
) => {
  if (!fileList) return;

  const filesArray = Array.from(fileList);

  if (filesArray.length === 0) {
    return;
  }

  const imageFiles = filesArray.filter((file) => /image/i.test(file.type));
  if (imageFiles.length === 0) {
    return;
  }

  event.preventDefault();

  handleUploadImages(textareaEl, imageFiles);
};

// TODO(dcramer): could we use cursor.wrapMultiLineSelected() for some of this
const prefixEachLine = (element: HTMLTextAreaElement, prefix: string) => {
  const cursor = new Cursor(element);
  const position = cursor.getCurrentPosition();

  const addPrefix = cursor.getLine().indexOf(prefix) !== 0;

  const removePrefix = (line: string) => {
    if (line.indexOf(`${prefix} `) === 0) return line.slice(prefix.length + 1);
    if (line.indexOf(prefix) === 0) return line.slice(prefix.length);
    return line;
  };

  const output = [];
  let line: string;
  for (var i = position.lineNumber; i <= position.lineNumberEnd; i++) {
    line = cursor.getLine(i);
    output.push(addPrefix ? `${prefix} ${line}` : removePrefix(line));
  }

  const modified = output.join("\n");

  cursor.spliceContent(Cursor.raw`${modified}`, {
    startLineNumber: position.lineNumber,
    replaceCount: output.length,
  });
};

// XXX(dcramer): the built-in 'unordered-list' command is not implemented well
const unorderedListCommandHandler: CommandHandler = ({ element }) => {
  return prefixEachLine(element, "-");
};

// XXX(dcramer): the built-in 'block-quotes' command is not implemented well
const quoteCommandHandler: CommandHandler = ({ element }) => {
  return prefixEachLine(element, ">");
};

// XXX(dcramer): the built-in 'code-block' command is not implemented well
const codeCommandHandler: CommandHandler = ({ element }) => {
  const cursor = new Cursor(element);
  const selected =
    cursor.getSelected() || cursor.getLine() || "function helloWorld() { }";
  const prefix = "```";
  const removeBlock =
    selected.indexOf(prefix) === 0 &&
    selected.indexOf(prefix, prefix.length) === selected.length - prefix.length;

  const removePrefix = (text: string) => {
    if (text.indexOf(prefix) === 0) text = text.slice(prefix.length);
    if (text.indexOf(prefix) === text.length - prefix.length)
      text = text.slice(0, -prefix.length);
    return text;
  };

  const lines = selected.split("\n");
  const modified = !removeBlock
    ? `${prefix}\n${selected}\n${prefix}`
    : removePrefix(selected);

  const position = cursor.getCurrentPosition();
  cursor.spliceContent(Cursor.raw`${modified}`, {
    startLineNumber: position.lineNumber,
    replaceCount: lines.length,
  });
};

const EditorWrapper = styled.div`
  textarea {
    width: 100%;
    border-radius: 0 0 6px 6px;
    border: 1px solid var(--gray200);
  }
`;

function Editor({ defaultValue }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue || "");
  const ref = useRef<TextareaMarkdownRef>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <EditorWrapper>
      <Tabs.Tabs defaultValue="edit">
        <Tabs.List>
          <Tabs.Trigger value="edit">Edit</Tabs.Trigger>
          <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="edit">
          <Toolbar.Toolbar aria-label="Formatting options">
            <Toolbar.Button
              value="bold"
              aria-label="Bold"
              onClick={() => ref.current?.trigger("bold")}
            >
              <FontBoldIcon />
            </Toolbar.Button>
            <Toolbar.Button
              value="italic"
              aria-label="Italic"
              onClick={() => ref.current?.trigger("italic")}
            >
              <FontItalicIcon />
            </Toolbar.Button>
            <Toolbar.Button
              value="strikethrough"
              aria-label="Strike through"
              onClick={() => ref.current?.trigger("strike-through")}
            >
              <StrikethroughIcon />
            </Toolbar.Button>
            <Toolbar.Separator />
            <Toolbar.Button
              value="unordered-list"
              aria-label="Unordered List"
              onClick={() => ref.current?.trigger("vg-unordered-list")}
            >
              <ListBulletIcon />
            </Toolbar.Button>
            <Toolbar.Button
              value="code-block"
              aria-label="code-block"
              onClick={() => ref.current?.trigger("vg-code-block")}
            >
              <CodeIcon />
            </Toolbar.Button>
            <Toolbar.Button
              value="quote-block"
              aria-label="quote-block"
              onClick={() => ref.current?.trigger("vg-quote-block")}
            >
              <QuoteIcon />
            </Toolbar.Button>
            <Toolbar.Separator />
            <Toolbar.Button
              value="link"
              aria-label="Link"
              onClick={() => ref.current?.trigger("link")}
            >
              <Link1Icon />
            </Toolbar.Button>
            <Toolbar.Button
              value="image"
              aria-label="image"
              onClick={(e) => {
                fileRef.current?.click();
              }}
            >
              <ImageIcon />
            </Toolbar.Button>
            {/* <Toolbar.Separator />
            <Toolbar.Link href="#" target="_blank" style={{ marginRight: 10 }}>
              Edited 2 hours ago
            </Toolbar.Link> */}
          </Toolbar.Toolbar>

          <TextareaMarkdown.Wrapper
            ref={ref}
            commands={[
              {
                name: "indent",
                enable: false,
              },
              {
                name: "vg-quote-block",
                handler: quoteCommandHandler,
              },
              {
                name: "vg-unordered-list",
                handler: unorderedListCommandHandler,
              },
              {
                name: "vg-code-block",
                handler: codeCommandHandler,
              },
            ]}
            options={{
              codeBlockPlaceholder: "```\nfunction helloWorld() { }\n```",
              blockQuotesPlaceholder: "> quote",
            }}
          >
            <TextareaAutosize
              name="content"
              minRows={15}
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              //   aria-invalid={actionData?.errors?.content ? true : undefined}
              //   aria-errormessage={
              //     actionData?.errors?.content ? "content-error" : undefined
              //   }
              onPaste={(event) => {
                onUploadFiles(ref.current!, event, event.clipboardData.files);
              }}
              onDrop={(event) => {
                onUploadFiles(ref.current!, event, event.dataTransfer.files);
              }}
            />
          </TextareaMarkdown.Wrapper>
        </Tabs.Content>
        <Tabs.Content value="preview">
          <Content>
            <Markdown content={value} />
          </Content>
        </Tabs.Content>
      </Tabs.Tabs>
      <input
        ref={fileRef}
        type="file"
        onClick={(event) => {}}
        onChange={(event) => {
          onUploadFiles(ref.current!, event, event.target.files);
          fileRef.current!.value = "";
        }}
        style={{ display: "none", position: "absolute", left: -100000 }}
      />
    </EditorWrapper>
  );
}

export default Editor;
