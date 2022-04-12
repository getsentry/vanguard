import React, { useEffect, useRef } from "react";
import { Form } from "@remix-run/react";
import type { TextareaMarkdownRef } from "textarea-markdown-editor";

import type { Category } from "../models/category.server";
import Editor from "./editor";

export type ActionData = {
  errors?: {
    title?: string;
    content?: string;
    categoryId?: string;
  };
};

export default function PostForm({
  categoryList,
  actionData,
}: {
  categoryList: Category[];
  actionData: ActionData;
}) {
  const contentRef = useRef<TextareaMarkdownRef>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  // const contentRef = useRef<HTMLTextAreaElement>(null);
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
      <h3>Create New Post</h3>

      <div>
        <label className="">
          <span>Title: </span>
          <input
            ref={titleRef}
            name="title"
            className=""
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
        <label>
          <span>Content: </span>
          <Editor contentRef={contentRef} />
          {actionData?.errors?.content && (
            <div className="pt-1 text-red-700" id="content-error">
              {actionData.errors.content}
            </div>
          )}
        </label>
      </div>

      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Category: </span>
          <select
            ref={categoryIdRef}
            name="categoryId"
            required
            className=""
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

      <div>
        <button
          type="submit"
          name="published"
          value="true"
          className="btn btn-primary"
        >
          Publish
        </button>
        <button type="submit" className="btn">
          Save Draft
        </button>
      </div>
    </Form>
  );
}
