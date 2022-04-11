import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useCatch, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { Post, updatePost } from "~/models/post.server";
import { deletePost } from "~/models/post.server";
import { getPost } from "~/models/post.server";
import { requireUserId } from "~/session.server";
import { useUser } from "~/utils";

type LoaderData = {
  post: Post;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  invariant(params.postId, "postId not found");

  const post = await getPost({ userId, id: params.postId });
  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }
  return json<LoaderData>({ post });
};

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  invariant(params.postId, "postId not found");

  const formData = await request.formData();
  const action = formData.get("action");
  if (action === "publish") {
    await updatePost({ userId, id: params.postId, published: true });
    return redirect(`/posts/${params.postId}`);
  } else if (action === "unpublish") {
    await updatePost({ userId, id: params.postId, published: false });
    return redirect(`/posts/${params.postId}`);
  } else if (action === "delete") {
    await deletePost({ userId, id: params.postId });
    return redirect("/");
  }
};

const PostActions = ({ post }: { post: Post }) => {
  return (
    <Form method="post">
      {!post.published ? (
        <button
          type="submit"
          name="action"
          value="publish"
          className="mx-4 rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Publish
        </button>
      ) : (
        <button
          type="submit"
          name="action"
          value="unpublish"
          className="mx-4 rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Unpublish
        </button>
      )}
      <button
        type="submit"
        name="action"
        value="delete"
        className="rounded bg-red-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
      >
        Delete
      </button>
    </Form>
  );
};

export default function PostDetailsPage() {
  const { post } = useLoaderData() as LoaderData;
  const user = useUser();

  return (
    <div className="post">
      <h2>{post.title}</h2>
      {!post.published && (
        <div className="py-6">
          <small>This post has not yet been published.</small>
        </div>
      )}
      <p>{post.content}</p>
      <hr className="my-4" />
      {post.authorId === user.id && <PostActions post={post} />}
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>Post not found</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
