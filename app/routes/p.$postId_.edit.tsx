import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";

import {
  announcePost,
  getPost,
  syndicatePost,
  updatePost,
} from "~/models/post.server";
import { requireUser, requireUserId } from "~/services/auth.server";
import { getCategory, getCategoryList } from "~/models/category.server";
import PostForm from "~/components/post-form";
import invariant from "tiny-invariant";
import { getPostLink } from "~/components/post-link";
import { getFeedList } from "~/models/feed.server";

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request, context);
  invariant(params.postId, "postId not found");
  const post = await getPost({ userId, id: params.postId });
  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }
  const categoryList = await getCategoryList({
    userId,
    includeRestricted: false,
  });
  const feedList = await getFeedList({
    userId,
    includeRestricted: false,
  });
  return json({ categoryList, feedList, post });
}

export async function action({ request, context, params }: ActionFunctionArgs) {
  const user = await requireUser(request, context);
  invariant(params.postId, "postId not found");

  const formData = await request.formData();
  const action = formData.get("action");
  const title = formData.get("title");
  const content = formData.get("content");
  const categoryId = formData.get("categoryId");
  // to check if they've unticked feedIds we have to make sure they were using the edit form vs the publish action
  const feedIds = action === "update" ? formData.getAll("feedId") : null;
  const published =
    formData.get("published") === null
      ? undefined
      : formData.get("published") === "true" ||
        formData.get("published") === "announce";

  const announce = published && formData.get("published") === "announce";
  const deleted =
    formData.get("deleted") !== null ? !!formData.get("deleted") : undefined;

  if (
    categoryId !== null &&
    (typeof categoryId !== "string" || categoryId.length === 0)
  ) {
    return json(
      { errors: { categoryId: "Category is required" } },
      { status: 400 },
    );
  }

  if (title !== null && (typeof title !== "string" || title.length === 0)) {
    return json({ errors: { title: "Title is required" } }, { status: 400 });
  }

  if (
    content !== null &&
    (typeof content !== "string" || content.length === 0)
  ) {
    return json(
      { errors: { content: "Content is required" } },
      { status: 400 },
    );
  }

  const data: { [key: string]: any } = {};

  // gross attempt to make this form partial
  if (categoryId !== null) data.categoryId = categoryId;
  if (title !== null) data.title = title;
  if (content !== null) data.content = content;
  if (published !== null) data.published = published;
  if (deleted !== null) data.deleted = deleted;
  if (feedIds !== null) {
    const allowedFeedIds = (
      await getFeedList({
        userId: user.id,
        includeRestricted: false,
      })
    ).map((f) => f.id);
    const invalid = feedIds.find((f) => allowedFeedIds.indexOf(f) === -1);
    if (invalid) {
      return json<ActionData>(
        { errors: { feedId: "Invalid feed" } },
        { status: 400 },
      );
    }
    data.feedIds = feedIds;
  }

  if (categoryId) {
    const category = await getCategory({ id: categoryId });
    if (!category || (category.restricted && !user.canPostRestricted)) {
      return json<ActionData>(
        { errors: { categoryId: "Invalid category" } },
        { status: 400 },
      );
    }

    const meta = [];
    let anyMeta = false;
    category.metaConfig.forEach(({ name, required }) => {
      const content = formData.get(`meta[${name}]`);
      if (content === null) return;
      anyMeta = true;
      if (required && !content) {
        return json<ActionData>(
          { errors: { meta: { name: `${name} is required` } } },
          { status: 400 },
        );
      }
      meta.push({
        name,
        content,
      });
    });
    if (anyMeta) data.meta = meta;
  }

  const post = await updatePost({
    id: params.postId,
    userId: user.id,
    ...data,
  });

  if (!post.deleted && announce) {
    await announcePost(post);
  }

  await syndicatePost(post);

  if (post.deleted) {
    return redirect("/");
  }

  return redirect(getPostLink(post));
}

export default function EditPostPage() {
  const { categoryList, feedList, post } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const meta: { [name: string]: string } = {};
  post.meta.forEach((m) => {
    meta[m.name] = m.content;
  });

  return (
    <PostForm
      categoryList={categoryList}
      feedList={feedList}
      errors={actionData?.errors}
      initialData={{
        title: post.title,
        content: post.content!,
        categoryId: post.categoryId,
        published: post.published,
        meta,
        feedIds: post.feeds.map((f) => f.id),
      }}
      canDelete={true}
      canUnpublish={true}
      canAnnounce={!post.published}
    />
  );
}
