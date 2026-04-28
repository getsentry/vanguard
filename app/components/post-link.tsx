import type { ComponentPropsWithRef, CSSProperties } from "react";
import { useViewTransitionState } from "react-router";
import type { Post } from "~/models/post.server";
import Link from "./link";

export const getPostLink = (post: Post): string => {
  return `/p/${post.id}`;
};

/**
 * `morphTitle` opts the link in to a named view transition (`post-<id>`)
 * while it is the active navigation target. The same component renders the
 * post title in list views (clustered + summary cards) and on the detail
 * page, so the matched names line up automatically and the title morphs
 * across the navigation.
 *
 * Only set `morphTitle` on ONE PostLink per post per page (the title) —
 * multiple elements sharing a `view-transition-name` cause the browser to
 * abort the transition.
 */
export default function PostLink({
  post,
  morphTitle = false,
  style,
  ...props
}: Omit<ComponentPropsWithRef<typeof Link>, "to"> & {
  post: Post;
  morphTitle?: boolean;
}) {
  const href = getPostLink(post);
  const isTransitioning = useViewTransitionState(href);
  const transitionStyle: CSSProperties | undefined =
    morphTitle && isTransitioning ? { viewTransitionName: `post-${post.id}` } : undefined;

  return (
    <Link
      color="none"
      to={href}
      viewTransition
      {...props}
      style={{ ...transitionStyle, ...style }}
    />
  );
}
