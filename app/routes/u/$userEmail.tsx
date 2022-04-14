import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import moment from "moment";

import { getPostList } from "~/models/post.server";
import type { Post } from "~/models/post.server";
import { getUserByEmail, updateUser } from "~/models/user.server";
import type { User } from "~/models/user.server";
import { requireAdmin, requireUser } from "~/session.server";
import PostLink from "~/components/post-link";
import * as Panel from "~/components/panel";

const UserAdmin: React.FC<{ user: User }> = ({ user }) => {
  return (
    <Panel.Panel>
      <Panel.Title>Admin</Panel.Title>
      <Form method="post">
        <ul>
          <li>
            {!user.admin ? (
              <button name="admin" value="true" type="submit">
                Make Admin
              </button>
            ) : (
              <button name="admin" value="false" type="submit">
                Remove Admin
              </button>
            )}
          </li>
          <li>
            {!user.canPostRestricted ? (
              <button name="canPostRestricted" value="true" type="submit">
                Allow posting in restricted categories
              </button>
            ) : (
              <button name="canPostRestricted" value="false" type="submit">
                Restrict posting in restricted categories
              </button>
            )}
          </li>
        </ul>
      </Form>
    </Panel.Panel>
  );
};

export const action: ActionFunction = async ({ request, params }) => {
  const currentUser = await requireAdmin(request);
  invariant(params.userEmail, "userEmail not found");

  const user = await getUserByEmail(params.userEmail);
  if (!user) {
    throw new Response("Not Found", { status: 404 });
  }

  const formData = await request.formData();
  const action = formData.get("action");
  if (formData.get("canPostRestricted") === "true") {
    await updateUser({
      userId: currentUser.id,
      id: user.id,
      canPostRestricted: true,
    });
  }
  if (formData.get("canPostRestricted") === "false") {
    await updateUser({
      userId: currentUser.id,
      id: user.id,
      canPostRestricted: false,
    });
  }
  if (formData.get("admin") === "true") {
    await updateUser({ userId: currentUser.id, id: user.id, admin: true });
  }
  if (formData.get("admin") === "false") {
    await updateUser({ userId: currentUser.id, id: user.id, admin: false });
  }
  return null;
};

type LoaderData = {
  postList: Post[];
  user: User;
  currentUser: User;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const currentUser = await requireUser(request);
  invariant(params.userEmail, "userEmail not found");

  const user = await getUserByEmail(params.userEmail);
  if (!user) {
    throw new Response("Not Found", { status: 404 });
  }

  const postList = await getPostList({
    userId: currentUser.id,
    authorId: user.id,
    published: true,
    limit: 5,
  });
  return json<LoaderData>({ currentUser, user, postList });
};

export default function UserDetailsPage() {
  const { currentUser, user, postList } = useLoaderData() as LoaderData;
  const actionData = useActionData() as ActionData;

  return (
    <div>
      <h1>{user.name}</h1>
      <h3>{user.email}</h3>

      <h2>Most Recent Posts</h2>
      {postList.length ? (
        <ul>
          {postList.map((post) => (
            <li key={post.id}>
              <h4>
                <PostLink post={post}>{post.title}</PostLink>
              </h4>
              <p>
                <Link to={`/c/${post.category.slug}`}>
                  {post.category.name}
                </Link>{" "}
                &mdash; {moment(post.createdAt).fromNow()}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p>They have yet to publish a post.</p>
      )}

      {currentUser.admin && <UserAdmin user={user} actionData={actionData} />}
    </div>
  );
}
