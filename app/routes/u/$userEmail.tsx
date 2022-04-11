import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { getPostList } from "~/models/post.server";
import type { Post } from "~/models/post.server";
import { getUserByEmail } from "~/models/user.server";
import type { User } from "~/models/user.server";
import { requireUserId } from "~/session.server";
type LoaderData = {
  postList: Post[];
  user: User;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const currentUserId = await requireUserId(request);
  invariant(params.userEmail, "userEmail not found");

  const user = await getUserByEmail(params.userEmail);
  if (!user) {
    throw new Response("Not Found", { status: 404 });
  }

  const postList = await getPostList({
    userId: currentUserId,
    authorId: user.id,
    published: true,
  });
  return json<LoaderData>({ user, postList });
};

export default function UserDetailsPage() {
  const { user, postList } = useLoaderData() as LoaderData;

  return (
    <div className="post">
      <h2>{user.name}</h2>
    </div>
  );
}
