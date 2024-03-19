import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { getPostList } from "~/models/post.server";
import type { Post } from "~/models/post.server";
import { getUserByEmail, updateUser } from "~/models/user.server";
import type { User } from "~/models/user.server";
import { requireAdmin, requireUser } from "~/services/auth.server";
import Avatar from "~/components/avatar";
import * as Panel from "~/components/panel";
import PostLink from "~/components/post-link";
import Markdown from "~/components/markdown";
import Button from "~/components/button";

type LoaderData = {
  postList: Post[];
  user: User;
  currentUser: User;
};

export const loader: LoaderFunction = async ({ request, context, params }) => {
  const currentUser = await requireUser(request, context);
  invariant(params.userEmail, "userEmail not found");

  const user = await getUserByEmail(params.userEmail);
  if (!user) {
    throw new Response("Not Found", { status: 404 });
  }

  const postList = await getPostList({
    userId: currentUser.id,
    authorId: user.id,
    published: true,
    limit: 20,
  });
  return json<LoaderData>({ currentUser, user, postList });
};

export const action: ActionFunction = async ({ request, context, params }) => {
  const currentUser = await requireAdmin(request, context);
  invariant(params.userEmail, "userEmail not found");

  const user = await getUserByEmail(params.userEmail);
  if (!user) {
    throw new Response("Not Found", { status: 404 });
  }

  const formData = await request.formData();
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

const UserAdmin: React.FC<{ user: User }> = ({ user }) => {
  return (
    <Panel.Panel>
      <Panel.Title>Admin</Panel.Title>
      <Form method="post">
        <ul>
          <li>
            {!user.admin ? (
              <Button baseStyle="link" name="admin" value="true" type="submit">
                Make Admin
              </Button>
            ) : (
              <Button baseStyle="link" name="admin" value="false" type="submit">
                Remove Admin
              </Button>
            )}
          </li>
          <li>
            {!user.canPostRestricted ? (
              <Button
                baseStyle="link"
                name="canPostRestricted"
                value="true"
                type="submit"
              >
                Allow posting in restricted categories
              </Button>
            ) : (
              <Button
                baseStyle="link"
                name="canPostRestricted"
                value="false"
                type="submit"
              >
                Restrict posting in restricted categories
              </Button>
            )}
          </li>
        </ul>
      </Form>
    </Panel.Panel>
  );
};

export default function UserDetailsPage() {
  const { currentUser, user, postList } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="mb-6 gap-x-6 flex items-center">
        <Avatar user={user} size="96px" />
        <div>
          <h1 className="text-4xl font-serif">{user.name}</h1>
          <div className="text-muted-light dark:text-muted-dark">
            {user.email}
          </div>
        </div>
      </div>

      {!!postList.length && (
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-2 mb-6">
          {postList.map((post) => (
            <div
              className="bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded p-4"
              key={post.id}
            >
              <h2 className="font-serif break-words mb-2 text-lg">
                <PostLink post={post}>{post.title}</PostLink>
              </h2>
              <Markdown content={post.content || ""} summarize />
            </div>
          ))}
        </div>
      )}

      {currentUser.admin && <UserAdmin user={user} />}
    </div>
  );
}
