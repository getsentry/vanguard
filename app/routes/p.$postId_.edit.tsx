import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { useActionData, useLoaderData } from "react-router";

import { announcePost, getPost, syndicatePost, updatePost } from "~/models/post.server";
import { requireUser } from "~/services/auth.server";
import { getCategory, getCategoryList } from "~/models/category.server";
import PostForm from "~/components/post-form";
import invariant from "tiny-invariant";
import { getPostLink } from "~/components/post-link";
import { getFeedList } from "~/models/feed.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  invariant(params.postId, "postId not found");

  // Post + category list + feed list are all independent — fetch in parallel.
  const [post, categoryList, feedList] = await Promise.all([
    getPost({ user, id: params.postId }),
    getCategoryList({ user, includeRestricted: false }),
    getFeedList({ user, includeRestricted: false }),
  ]);

  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }
  return { categoryList, feedList, post };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  invariant(params.postId, "postId not found");

  const formData = await request.formData();
  const action = formData.get("action");
  const title = formData.get("title");
  const content = formData.get("content");
  const categoryId = formData.get("categoryId");
  // to check if they've unticked feedIds we have to make sure they were using the edit form vs the publish action
  const feedIds = action === "update" ? (formData.getAll("feedId") as string[]) : null;
  const published =
    formData.get("published") === null
      ? undefined
      : formData.get("published") === "true" || formData.get("published") === "announce";

  const announce = published && formData.get("published") === "announce";
  const deleted = formData.get("deleted") !== null ? !!formData.get("deleted") : undefined;

  if (categoryId !== null && (typeof categoryId !== "string" || categoryId.length === 0)) {
    return Response.json({ errors: { categoryId: "Category is required" } }, { status: 400 });
  }

  if (title !== null && (typeof title !== "string" || title.length === 0)) {
    return Response.json({ errors: { title: "Title is required" } }, { status: 400 });
  }

  if (content !== null && (typeof content !== "string" || content.length === 0)) {
    return Response.json({ errors: { content: "Content is required" } }, { status: 400 });
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
        user,
        includeRestricted: false,
      })
    ).map((f) => f.id);
    const invalid = feedIds.find((f) => allowedFeedIds.indexOf(f) === -1);
    if (invalid) {
      return Response.json({ errors: { feedId: "Invalid feed" } }, { status: 400 });
    }
    data.feedIds = feedIds;
  }

  if (categoryId && typeof categoryId === "string") {
    const category = await getCategory({ id: categoryId });
    if (!category || (category.restricted && !user.canPostRestricted)) {
      return Response.json({ errors: { categoryId: "Invalid category" } }, { status: 400 });
    }

    const meta = [];
    let anyMeta = false;
    category.metaConfig.forEach(({ name, required }) => {
      const content = formData.get(`meta[${name}]`);
      if (content === null) return;
      anyMeta = true;
      if (required && !content) {
        return Response.json(
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
    user,
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
  const actionData = useActionData() as { errors?: Record<string, any> } | undefined;

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
