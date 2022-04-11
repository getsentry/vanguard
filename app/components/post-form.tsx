import React, { useEffect, useRef } from "react";
import type { ClipboardEvent, DragEvent } from "react";
import { Form } from "@remix-run/react";
import TextareaAutosize from "react-textarea-autosize";
import TextareaMarkdown, { Cursor } from "textarea-markdown-editor";
import type { TextareaMarkdownRef } from "textarea-markdown-editor";

import type { Category } from "../models/category.server";
import toast from "react-hot-toast";

export type ActionData = {
  errors?: {
    title?: string;
    content?: string;
    categoryId?: string;
  };
};

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

export default function PostForm({
  categoryList,
  actionData,
}: {
  categoryList: Category[];
  actionData: ActionData;
}) {
  const textareaMarkdownRef = useRef<TextareaMarkdownRef>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const categoryIdRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (actionData?.errors?.title) {
      titleRef.current?.focus();
    } else if (actionData?.errors?.content) {
      contentRef.current?.focus();
    } else if (actionData?.errors?.categoryId) {
      categoryIdRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Form
      method="post"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
      className="p-4"
    >
      <h1>Create New Post</h1>

      <div>
        <label className="flex w-full flex-col gap-1">
          <input
            ref={titleRef}
            name="title"
            className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
            required
            placeholder="Title"
            autoFocus
            aria-invalid={actionData?.errors?.title ? true : undefined}
            aria-errormessage={
              actionData?.errors?.title ? "title-error" : undefined
            }
          />
        </label>
        {actionData?.errors?.title && (
          <div className="pt-1 text-red-700" id="title-error">
            {actionData.errors.title}
          </div>
        )}
      </div>

      <div>
        <TextareaMarkdown.Wrapper
          ref={textareaMarkdownRef}
          commands={[
            {
              name: "indent",
              enable: false,
            },
          ]}
        >
          <TextareaAutosize
            ref={contentRef}
            name="content"
            minRows={15}
            required
            className="w-full flex-1 rounded-md border-2 border-blue-500 py-2 px-3 text-lg leading-6"
            aria-invalid={actionData?.errors?.content ? true : undefined}
            aria-errormessage={
              actionData?.errors?.content ? "content-error" : undefined
            }
            onPaste={(event) => {
              onUploadFiles(event, event.clipboardData.files);
            }}
            onDrop={(event) => {
              onUploadFiles(event, event.dataTransfer.files);
            }}
          />
        </TextareaMarkdown.Wrapper>
        {actionData?.errors?.content && (
          <div className="pt-1 text-red-700" id="content-error">
            {actionData.errors.content}
          </div>
        )}
      </div>

      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Category: </span>
          <select
            ref={categoryIdRef}
            name="categoryId"
            required
            className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
            aria-invalid={actionData?.errors?.categoryId ? true : undefined}
            aria-errormessage={
              actionData?.errors?.categoryId ? "categoryId-error" : undefined
            }
          >
            <option />
            {categoryList.map((category) => (
              <option value={category.id} key={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        {actionData?.errors?.categoryId && (
          <div className="pt-1 text-red-700" id="categoryId-error">
            {actionData.errors.categoryId}
          </div>
        )}
      </div>

      <div className="text-right">
        <button
          type="submit"
          className="m-2 rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Save Draft
        </button>
        <button
          type="submit"
          name="published"
          value="true"
          className="rounded bg-gray-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Publish
        </button>
      </div>
    </Form>
  );
}
