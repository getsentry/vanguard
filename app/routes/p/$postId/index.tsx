import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useCatch, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { deletePost, getPost, updatePost } from "~/models/post.server";
import type { Post } from "~/models/post.server";
import type { User } from "~/models/user.server";
import { requireUser, requireUserId } from "~/session.server";
import { default as PostTemplate } from "~/components/post";
import moment from "moment";
import { DefinitionList } from "~/components/definition-list";
import * as Panel from "~/components/panel";
import Block from "~/components/block";

type LoaderData = {
  post: Post;
  user: User;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireUser(request);
  invariant(params.postId, "postId not found");

  const post = await getPost({ userId: user.id, id: params.postId });
  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }
  return json<LoaderData>({ post, user });
};

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  invariant(params.postId, "postId not found");

  const post = await getPost({ userId, id: params.postId });
  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }

  const formData = await request.formData();
  const action = formData.get("action");
  if (action === "publish") {
    await updatePost({ userId, id: params.postId, published: true });
    //return redirect(`/posts/${params.postId}`);
  } else if (action === "unpublish") {
    await updatePost({ userId, id: params.postId, published: false });
    //return redirect(`/posts/${params.postId}`);
  } else if (action === "edit") {
    return redirect(`/p/${post!.id}/edit`);
  } else if (action === "delete") {
    await deletePost({ userId, id: params.postId });
    return redirect("/");
  }
  return null;
};

const PostActions = ({ post }: { post: Post }) => {
  return (
    <Block>
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
          value="edit"
          className="mx-4 rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Edit
        </button>
        <button
          type="submit"
          name="action"
          value="delete"
          className="mx-4 rounded bg-red-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
        >
          Delete
        </button>
      </Form>
    </Block>
  );
};

const PostAdmin = ({ post }: { post: Post }) => {
  return (
    <Panel.Panel>
      <Panel.Title>Admin</Panel.Title>
      <DefinitionList>
        <dt>Created At</dt>
        <dd>{moment(post.createdAt).format()}</dd>
        <dt>Published At</dt>
        <dd>{moment(post.publishedAt).format()}</dd>
        <dt>Updated At</dt>
        <dd>{moment(post.updatedAt).format()}</dd>
      </DefinitionList>
    </Panel.Panel>
  );
};

export default function PostDetailsPage() {
  const { post, user } = useLoaderData() as LoaderData;

  return (
    <div>
      <PostTemplate post={post} />
      <hr className="my-4" />
      {(post.authorId === user.id || user.admin) && <PostActions post={post} />}
      {user.admin && <PostAdmin post={post} />}
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
