import { Link } from "@remix-run/react";
import React from "react";
import type { Post } from "~/models/post.server";

export const getPostLink = (post: Post): string => {
  return `/p/${post.id}`;
};

const PostLink: React.FC<{
  post: Post;
}> = function PostLink({ post, children }) {
  return <Link to={getPostLink(post)}>{children}</Link>;
};

export default PostLink;
