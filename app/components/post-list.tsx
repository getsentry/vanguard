import PostLink from "~/components/post-link";
import Avatar from "~/components/avatar";
import TimeSince from "./timeSince";
import Link from "./link";
import { getDisplayName } from "~/lib/user";

export default function PostList({ postList }) {
  return (
    <div>
      {postList.map((post) => (
        <li
          className="grid mb-4"
          style={{
            gridTemplateColumns: "4rem auto",
            gridTemplateAreas: `
            "avatar title"
            "avatar credits"
          `,
          }}
          key={post.id}
        >
          <div
            className="break-words"
            style={{
              gridArea: "title",
            }}
          >
            {/* No `morphTitle` here — PostList renders in the sidebar on every
             * page, so a post appearing in both the sidebar and the main feed
             * would otherwise have two elements claim the same
             * `view-transition-name` and abort the transition. */}
            <PostLink className="hover:underline" post={post}>
              {post.title}
            </PostLink>
          </div>
          <div style={{ gridArea: "avatar" }}>
            <Avatar user={post.author} />
          </div>
          <div
            className="flex gap-3 items-center font-mono text-secondary-light dark:text-secondary-dark"
            style={{
              gridArea: "credits",
            }}
          >
            <div className="font-medium text-sm">
              <Link to={`/u/${post.author.email}`}>{getDisplayName(post.author)}</Link>
            </div>
            <div className="text-xs">
              <TimeSince date={post.publishedAt} />
            </div>
          </div>
        </li>
      ))}
    </div>
  );
}
