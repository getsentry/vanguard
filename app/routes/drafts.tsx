import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { requireUser } from "~/services/auth.server";
import { getPostList } from "~/models/post.server";
import Post from "~/components/post";
import PageHeader from "~/components/page-header";
import Link from "~/components/link";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const postList = await getPostList({
    user,
    authorId: user.id,
    published: false,
  });
  return { postList };
}

export default function Drafts() {
  const { postList } = useLoaderData<typeof loader>();

  return (
    <div>
      <PageHeader title="My Drafts" />
      {postList.length === 0 ? (
        <p className="p-4">
          You've got no posts in draft form. <Link to="/new-post">Get to writing!</Link>
        </p>
      ) : (
        postList.map((post) => <Post post={post} key={post.id} summary canEdit />)
      )}
    </div>
  );
}
