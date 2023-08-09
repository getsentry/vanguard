import type { ComponentPropsWithRef } from "react";
import type { Post } from "~/models/post.server";
import Link from "./link";

export const getPostLink = (post: Post): string => {
  return `/p/${post.id}`;
};

export default function PostLink({
  post,
  ...props
}: Omit<ComponentPropsWithRef<typeof Link>, "to"> & {
  post: Post;
}) {
  return <Link color="none" to={getPostLink(post)} {...props} />;
}
