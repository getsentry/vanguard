import { Link } from "@remix-run/react";
import React from "react";
import type { getPost } from "~/models/post.server";

const PostLink: React.FC<{
  post: Awaited<ReturnType<typeof getPost>>;
}> = function PostLink({ post, children }) {
  return <Link to={`/${post.category.slug}/${post.id}`}>{children}</Link>;
};

export default PostLink;
