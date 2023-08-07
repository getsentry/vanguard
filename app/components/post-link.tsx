import { Link } from "@remix-run/react";
import type { ComponentPropsWithRef } from "react";
import type { Post } from "~/models/post.server";

export const getPostLink = (post: Post): string => {
  return `/p/${post.id}`;
};

export default function PostLink({
  post,
  ...props
}: Omit<ComponentPropsWithRef<typeof Link>, "to"> & {
  post: Post;
}) {
  return <Link to={getPostLink(post)} className="hover:underline" {...props} />;
}
