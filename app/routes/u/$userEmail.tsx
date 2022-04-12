import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import moment from "moment";

import { getPostList } from "~/models/post.server";
import type { Post } from "~/models/post.server";
import { getUserByEmail } from "~/models/user.server";
import type { User } from "~/models/user.server";
import { requireUserId } from "~/session.server";
import PostLink from "~/components/post-link";

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
    limit: 5,
  });
  return json<LoaderData>({ user, postList });
};

export default function UserDetailsPage() {
  const { user, postList } = useLoaderData() as LoaderData;

  return (
    <div className="post">
      <h1>{user.name}</h1>

      <h2>Most Recent Posts</h2>
      <ul>
        {postList.map((post) => (
          <li key={post.id}>
            <h4>
              <PostLink post={post}>{post.title}</PostLink>
            </h4>
            <p>
              <Link to={`/${post.category.slug}`}>{post.category.name}</Link>{" "}
              &mdash; {moment(post.createdAt).fromNow()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
