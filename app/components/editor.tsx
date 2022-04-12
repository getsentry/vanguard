import React, { useRef, useState } from "react";
import type { ClipboardEvent, DragEvent } from "react";
import TextareaAutosize from "react-textarea-autosize";
import TextareaMarkdown, { Cursor } from "textarea-markdown-editor";
import type { TextareaMarkdownRef } from "textarea-markdown-editor";
import styled from "styled-components";
import * as Toolbar from "./editor-toolbar";
import * as Tabs from "./editor-tabs";
import toast from "react-hot-toast";
import {
  StrikethroughIcon,
  TextAlignLeftIcon,
  TextAlignCenterIcon,
  TextAlignRightIcon,
  FontBoldIcon,
  FontItalicIcon,
} from "@radix-ui/react-icons";
import Markdown from "./markdown";

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/upload-image", {
    method: "POST",
    body: formData,
  });

  return await res.json();
}

function replaceText(cursor: Cursor, text: string, replaceWith: string) {
  cursor.setText(cursor.getText().replace(text, replaceWith));
}

function handleUploadImages(textareaEl: HTMLTextAreaElement, files: File[]) {
  const cursor = new Cursor(textareaEl);
  const currentLineNumber = cursor.getCurrentPosition().lineNumber;

  files.forEach(async (file, idx) => {
    const loadingText = `![Uploading ${file.name}...]()`;

    cursor.spliceContent(Cursor.raw`${loadingText}${Cursor.$}`, {
      startLineNumber: currentLineNumber + idx,
    });

    try {
      const uploadedImage = await uploadImage(file);

      replaceText(
        cursor,
        loadingText,
        `<img alt="${uploadedImage.originalFilename}" src="${uploadedImage.url}">`
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
  event: DragEvent<HTMLTextAreaElement> | ClipboardEvent<HTMLTextAreaElement>,
  // TODO: this aint quite the right type
  fileList: FileList
) => {
  const filesArray = Array.from(fileList);

  if (filesArray.length === 0) {
    return;
  }

  // remove any non-image
  const imageFiles = filesArray.filter((file) => /image/i.test(file.type));
  if (imageFiles.length === 0) {
    return;
  }

  event.preventDefault();

  handleUploadImages(event.currentTarget, imageFiles);
};

const EditorWrapper = styled.div`
  textarea {
    width: 100%;
  }
`;

function Editor({}: {}) {
  const [value, setValue] = useState("");
  const ref = useRef<TextareaMarkdownRef>(null);

  return (
    <EditorWrapper>
      <Tabs.Tabs defaultValue="edit">
        <Tabs.List>
          <Tabs.Trigger value="edit">Edit</Tabs.Trigger>
          <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="edit">
          <Toolbar.Toolbar aria-label="Formatting options">
            <Toolbar.ToggleGroup type="multiple" aria-label="Text formatting">
              <Toolbar.ToggleItem value="bold" aria-label="Bold">
                <FontBoldIcon />
              </Toolbar.ToggleItem>
              <Toolbar.ToggleItem value="italic" aria-label="Italic">
                <FontItalicIcon />
              </Toolbar.ToggleItem>
              <Toolbar.ToggleItem
                value="strikethrough"
                aria-label="Strike through"
              >
                <StrikethroughIcon />
              </Toolbar.ToggleItem>
            </Toolbar.ToggleGroup>
            <Toolbar.Separator />
            <Toolbar.ToggleGroup
              type="single"
              defaultValue="center"
              aria-label="Text alignment"
            >
              <Toolbar.ToggleItem value="left" aria-label="Left aligned">
                <TextAlignLeftIcon />
              </Toolbar.ToggleItem>
              <Toolbar.ToggleItem value="center" aria-label="Center aligned">
                <TextAlignCenterIcon />
              </Toolbar.ToggleItem>
              <Toolbar.ToggleItem value="right" aria-label="Right aligned">
                <TextAlignRightIcon />
              </Toolbar.ToggleItem>
            </Toolbar.ToggleGroup>
            <Toolbar.Separator />
            <Toolbar.Link href="#" target="_blank" style={{ marginRight: 10 }}>
              Edited 2 hours ago
            </Toolbar.Link>
            <Toolbar.Button style={{ marginLeft: "auto" }}>
              Share
            </Toolbar.Button>
          </Toolbar.Toolbar>

          <TextareaMarkdown.Wrapper
            ref={ref}
            commands={[
              {
                name: "indent",
                enable: false,
              },
            ]}
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
                onUploadFiles(event, event.clipboardData.files);
              }}
              onDrop={(event) => {
                onUploadFiles(event, event.dataTransfer.files);
              }}
            />
          </TextareaMarkdown.Wrapper>
        </Tabs.Content>
        <Tabs.Content value="preview">
          <Markdown content={value} />
        </Tabs.Content>
      </Tabs.Tabs>
    </EditorWrapper>
  );
}

export default Editor;
