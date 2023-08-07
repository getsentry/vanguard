import { useEffect, useRef, useState } from "react";
import type { ClipboardEvent, DragEvent, ChangeEvent } from "react";
import TextareaAutosize from "react-textarea-autosize";
import TextareaMarkdown, { Cursor } from "textarea-markdown-editor";
import type { TextareaMarkdownRef } from "textarea-markdown-editor";
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
import * as Toolbar from "@radix-ui/react-toolbar";
import * as Tabs from "@radix-ui/react-tabs";

import Content from "./content";
import Markdown from "./markdown";

function replaceText(cursor: Cursor, text: string, replaceWith: string) {
  cursor.setValue(cursor.value.replace(text, replaceWith));
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

  fileList.forEach(async (file, idx) => {
    const loadingText = `![Uploading ${file.name}...]()`;

    cursor.insert(`${loadingText}${Cursor.MARKER}`);

    try {
      const uploadedImage = await uploadImage(file);

      replaceText(
        cursor,
        loadingText,
        `![${uploadedImage.originalFilename}](${uploadedImage.url})`,
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
  fileList: FileList | null,
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

  const ref = useRef<TextareaMarkdownRef>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const editorBlock = (
    <>
      <Toolbar.Toolbar
        className="editor-toolbar"
        aria-label="Formatting options"
      >
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
          onClick={() => ref.current?.trigger("unordered-list")}
        >
          <ListBulletIcon />
        </Toolbar.Button>
        <Toolbar.Button
          value="code-block"
          aria-label="code-block"
          onClick={() => ref.current?.trigger("code-block")}
        >
          <CodeIcon />
        </Toolbar.Button>
        <Toolbar.Button
          value="block-quotes"
          aria-label="block-quotes"
          onClick={() => ref.current?.trigger("block-quotes")}
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
      </Toolbar.Toolbar>

      <TextareaMarkdown.Wrapper
        ref={ref}
        options={{
          codeBlockPlaceholder: "```\nfunction helloWorld() { }\n```",
          blockQuotesPlaceholder: "> quote",
        }}
      >
        <TextareaAutosize
          name={name}
          minRows={minRows}
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
        onClick={(event) => {}}
        accept="image/*"
        multiple
        onChange={(event) => {
          onUploadFiles(ref.current!, event, event.target.files);
          fileRef.current!.value = "";
        }}
        style={{ display: "none", position: "absolute", left: -100000 }}
      />
    </div>
  );
}

export default Editor;
