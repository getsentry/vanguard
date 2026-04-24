import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { useActionData, useLoaderData } from "react-router";

import { announcePost, createPost, syndicatePost } from "~/models/post.server";
import { requireUser, requireUserId } from "~/services/auth.server";
import { getCategory, getCategoryList } from "~/models/category.server";
import PostForm from "~/components/post-form";
import { getPostLink } from "~/components/post-link";
import { getFeedList } from "~/models/feed.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const categoryList = await getCategoryList({
    userId,
    includeRestricted: false,
  });
  const feedList = await getFeedList({
    userId,
    includeRestricted: false,
  });
  return { categoryList, feedList };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);

  const formData = await request.formData();
  const title = formData.get("title");
  const content = formData.get("content");
  const categoryId = formData.get("categoryId");
  const published =
    formData.get("published") === "true" ||
    formData.get("published") === "announce";
  const announce = formData.get("published") === "announce";
  const feedIds = formData.get("feedId")
    ? (formData.getAll("feedId") as string[])
    : null;

  if (typeof categoryId !== "string" || categoryId.length === 0) {
    return Response.json(
      { errors: { categoryId: "Category is required" } },
      { status: 400 },
    );
  }

  if (typeof title !== "string" || title.length === 0) {
    return Response.json(
      { errors: { title: "Title is required" } },
      { status: 400 },
    );
  }

  if (typeof content !== "string" || content.length === 0) {
    return Response.json(
      { errors: { content: "Content is required" } },
      { status: 400 },
    );
  }

  if (feedIds !== null) {
    const allowedFeedIds = (
      await getFeedList({
        userId: user.id,
        includeRestricted: false,
      })
    ).map((f) => f.id);
    const invalid = feedIds.find((f) => allowedFeedIds.indexOf(f) === -1);
    if (invalid) {
      return Response.json(
        { errors: { feedId: "Invalid feed" } },
        { status: 400 },
      );
    }
  }

  const category = await getCategory({ id: categoryId });
  if (!category || (category.restricted && !user.canPostRestricted)) {
    return Response.json(
      { errors: { categoryId: "Invalid category" } },
      { status: 400 },
    );
  }
  const meta = [];
  category.metaConfig.forEach(({ name, required }) => {
    const content = formData.get(`meta[${name}]`);
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

  const post = await createPost({
    userId: user.id,
    title,
    content,
    categoryId,
    published,
    meta,
    feedIds,
  });

  if (announce) {
    await announcePost(post);
  }

  await syndicatePost(post);

  return redirect(getPostLink(post));
}

export default function NewPostPage() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData() as
    | { errors?: Record<string, any> }
    | undefined;

  return (
    <PostForm
      categoryList={loaderData.categoryList}
      feedList={loaderData.feedList}
      errors={actionData?.errors}
    />
  );
}
