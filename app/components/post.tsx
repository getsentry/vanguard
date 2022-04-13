import { Link } from "@remix-run/react";
import PostLink from "./post-link";
import Markdown from "./markdown";
import moment from "moment";

export default function Post({ post }: { post: object }) {
  return (
    <div className="post">
      <h2>
        <PostLink post={post}>{post.title}</PostLink>
      </h2>
      <h3>
        <Link to={`/${post.category.slug}`}>{post.category.name}</Link> &mdash;
        By <Link to={`/u/${post.author.email}`}>{post.author.name}</Link>{" "}
        &mdash; {moment(post.createdAt).fromNow()}
      </h3>
      {!post.published && (
        <div className="py-6">
          <small>This post has not yet been published.</small>
        </div>
      )}
      <Markdown content={post.content || ""} />
    </div>
  );
}
