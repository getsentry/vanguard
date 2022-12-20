import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import styled from "styled-components";
import breakpoint from "styled-components-breakpoint";

import { getPostList } from "~/models/post.server";
import type { Post } from "~/models/post.server";
import { getUserByEmail, updateUser } from "~/models/user.server";
import type { User } from "~/models/user.server";
import { requireAdmin, requireUser } from "~/services/auth.server";
import Avatar from "~/components/avatar";
import * as Panel from "~/components/panel";
import PostLink from "~/components/post-link";
import Markdown from "~/components/markdown";

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

export const action: ActionFunction = async ({ request, params }) => {
  const currentUser = await requireAdmin(request);
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

const ProfileHeader = styled.div`
  display: flex;
  margin-bottom: 3rem;
  align-items: center;

  ${Avatar} {
    width: 96px;
    height: 96px;
    margin-right: 1.6rem;
  }
`;

const Name = styled.h1`
  margin: 0;
`;

const ContactInfo = styled.div`
  color: ${(p) => p.theme.textMuted};
  font-size: 1em;
`;

const PostList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;

  ${breakpoint("desktop")`
    grid-template-columns: 1fr 1fr;
  `}
`;

const PostCardTitle = styled.h2`
  font-family: "Gazpacho-Heavy", serif;
  overflow-wrap: break-word;
`;

const PostCard = styled.div`
  background: ${(p) => p.theme.bgColor};
  border: 1px solid ${(p) => p.theme.borderColor};
  border-radius: 6px;
  padding: 2.4rem;

  ${PostCardTitle} {
    margin-bottom: 1rem;
  }

  p {
    margin-bottom: 0;
  }
`;

export default function UserDetailsPage() {
  const { currentUser, user, postList } = useLoaderData() as LoaderData;

  return (
    <div>
      <ProfileHeader>
        <Avatar user={user} />
        <div>
          <Name>{user.name}</Name>
          <ContactInfo>{user.email}</ContactInfo>
        </div>
      </ProfileHeader>

      {!!postList.length && (
        <PostList>
          {postList.map((post) => (
            <PostCard key={post.id}>
              <PostCardTitle>
                <PostLink post={post}>{post.title}</PostLink>
              </PostCardTitle>
              <Markdown content={post.content || ""} summarize />
            </PostCard>
          ))}
        </PostList>
      )}

      {currentUser.admin && <UserAdmin user={user} />}
    </div>
  );
}
