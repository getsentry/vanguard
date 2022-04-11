import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import * as React from "react";

import { createPost } from "~/models/post.server";
import { requireUserId } from "~/session.server";
import { getCategory, getCategoryList } from "~/models/category.server";
import type { Category } from "~/models/category.server";
import slugify from "slugify";

type LoaderData = {
  categoryList: Category[];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const categoryList = await getCategoryList({
    userId,
    includeRestricted: false,
  });
  return json<LoaderData>({ categoryList });
};

type ActionData = {
  errors?: {
    title?: string;
    content?: string;
    categoryId?: string;
  };
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const title = formData.get("title");
  const content = formData.get("content");
  const categoryId = formData.get("categoryId");
  const published = formData.get("published");

  if (typeof categoryId !== "string" || categoryId.length === 0) {
    return json<ActionData>(
      { errors: { categoryId: "Category is required" } },
      { status: 400 }
    );
  }

  if (typeof title !== "string" || title.length === 0) {
    return json<ActionData>(
      { errors: { title: "Title is required" } },
      { status: 400 }
    );
  }

  if (typeof content !== "string" || content.length === 0) {
    return json<ActionData>(
      { errors: { content: "Content is required" } },
      { status: 400 }
    );
  }

  const post = await createPost({
    title,
    content,
    categoryId,
    userId,
    published: !!published,
  });

  const category = await getCategory({ id: categoryId });

  return redirect(
    `/${category.slug}/${post.id}-${slugify(post.title, { lower: true })}`
  );
};

export default function NewPostPage() {
  const loaderData = useLoaderData() as LoaderData;
  const actionData = useActionData() as ActionData;
  const titleRef = React.useRef<HTMLInputElement>(null);
  const contentRef = React.useRef<HTMLTextAreaElement>(null);
  const categoryIdRef = React.useRef<HTMLSelectElement>(null);

  React.useEffect(() => {
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
          <span>Title: </span>
          <input
            ref={titleRef}
            name="title"
            className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
            required
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
        <label className="flex w-full flex-col gap-1">
          <span>Content: </span>
          <textarea
            ref={contentRef}
            name="content"
            rows={8}
            required
            className="w-full flex-1 rounded-md border-2 border-blue-500 py-2 px-3 text-lg leading-6"
            aria-invalid={actionData?.errors?.content ? true : undefined}
            aria-errormessage={
              actionData?.errors?.content ? "content-error" : undefined
            }
          />
        </label>
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
            {loaderData.categoryList.map((category) => (
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
