import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import styled from "styled-components";

import { getPostList } from "~/models/post.server";
import type { Post } from "~/models/post.server";
import { getUserByEmail, updateUser } from "~/models/user.server";
import type { User } from "~/models/user.server";
import { requireAdmin, requireUser } from "~/session.server";
import Avatar from "~/components/avatar";
import * as Panel from "~/components/panel";
import Post from "~/components/post";
import PostLink from "~/components/post-link";
import Markdown from "~/components/markdown";

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

const ProfileHeader = styled.div`
  display: grid;
  grid-template:
    "name avatar"
    "email avatar"
    / auto 96px;

  margin-bottom: 3.2rem;
  gap: 5px;

  h1 {
    grid-area: name;
    margin: 0;
  }

  ${Avatar} {
    width: 96px;
    height: 96px;
    grid-area: avatar;
  }
`;

const ContactInfo = styled.div`
  color: #666;
  font-size: 1em;
  grid-area: email;
`;

const PostList = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
`;

export default function UserDetailsPage() {
  const { currentUser, user, postList } = useLoaderData() as LoaderData;
  const actionData = useActionData() as ActionData;

  return (
    <div>
      <ProfileHeader>
        <Avatar user={user} />
        <h1>{user.name}</h1>
        <ContactInfo>{user.email}</ContactInfo>
      </ProfileHeader>

      {!!postList.length && (
        <PostList>
          {postList.map((post) => (
            <Panel.Panel key={post.id}>
              <Panel.Title>
                <PostLink post={post}>{post.title}</PostLink>
              </Panel.Title>
              <Markdown content={post.content || ""} summarize />
            </Panel.Panel>
          ))}
        </PostList>
      )}

      {currentUser.admin && <UserAdmin user={user} actionData={actionData} />}
    </div>
  );
}
