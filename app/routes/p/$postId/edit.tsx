import React from "react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";

import { announcePost, getPost, updatePost } from "~/models/post.server";
import type { Post } from "~/models/post.server";
import { requireUserId } from "~/session.server";
import { getCategoryList } from "~/models/category.server";
import type { Category } from "~/models/category.server";
import PostForm, { PostFormErrors } from "~/components/post-form";
import invariant from "tiny-invariant";
import { getPostLink } from "~/components/post-link";

type LoaderData = {
  categoryList: Category[];
  post: Post;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  invariant(params.postId, "postId not found");
  const post = await getPost({ userId, id: params.postId });
  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }
  const categoryList = await getCategoryList({
    userId,
    includeRestricted: false,
  });
  return json<LoaderData>({ categoryList, post });
};

type ActionData = {
  errors?: PostFormErrors;
};

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  invariant(params.postId, "postId not found");

  const formData = await request.formData();
  const title = formData.get("title");
  const content = formData.get("content");
  const categoryId = formData.get("categoryId");
  const published =
    formData.get("published") === null
      ? undefined
      : formData.get("published") === "true";
  const announce = published && formData.get("announce");
  const deleted =
    formData.get("deleted") !== null ? !!formData.get("deleted") : undefined;

  console.log(published);

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

  const post = await updatePost({
    id: params.postId,
    userId,
    title,
    content,
    categoryId,
    published,
    deleted,
  });

  if (!post.deleted && announce) {
    announcePost(post);
  }

  if (post.deleted) {
    return redirect("/");
  }

  return redirect(getPostLink(post));
};

export default function EditPostPage() {
  const { categoryList, post } = useLoaderData() as LoaderData;
  const actionData = useActionData() as ActionData;

  return (
    <PostForm
      categoryList={categoryList}
      errors={actionData?.errors}
      initialData={{
        title: post.title,
        content: post.content!,
        categoryId: post.categoryId,
        published: post.published,
      }}
      canDelete={true}
      canUnpublish={true}
      canAnnounce={!post.published}
    />
  );
}
