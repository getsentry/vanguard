import Avatar from "./avatar";
import PostLink from "./post-link";
import CategoryTag from "./category-tag";
import Middot from "./middot";
import IconCollapsedPost from "~/icons/IconCollapsedPost";
import { ChatBubbleIcon, HeartIcon } from "@radix-ui/react-icons";
import TimeSince from "./timeSince";
import type { Category, Post } from "@prisma/client";
import Link from "./link";

export default function ClusteredPostList({
  category,
  posts,
  reactions,
  commentCounts,
}: {
  category: Category;
  posts: Post[];
  reactions: any;
  commentCounts: any;
}) {
  return (
    <div className="relative mb-12 mt-16 clustered-post-list">
      <CategoryTag category={category} />
      <ul>
        {posts.map((post) => {
          const postReactions = reactions[post.id];
          const totalReactions = postReactions.reduce(
            (value, r) => value + r.total,
            0,
          );
          const totalComments = commentCounts[post.id];
          return (
            <li key={post.id} className="clustered-post">
              <IconCollapsedPost className="collapsed-post-icon" />
              <h3 className="text-3xl font-serif mb-2 break-words">
                <PostLink post={post}>{post.title}</PostLink>
              </h3>
              <div className="flex flex-1 justify-between items-center gap-2 font-mono text-sm">
                <Avatar size="24px" user={post.author} />

                <div className="font-medium text-base">
                  <Link to={`/u/${post.author.email}`}>
                    {post.author.name || post.author.email}
                  </Link>
                </div>
                <div className="text-gray-500 dark:text-gray-300 flex flex-grow gap-x-2">
                  <Middot />
                  <div>
                    <TimeSince date={post.publishedAt || post.createdAt} />
                  </div>
                  <Middot />
                  <div className="flex items-center gap-2">
                    <HeartIcon /> {totalReactions.toLocaleString()}
                  </div>
                  <Middot />
                  <div className="flex items-center gap-2">
                    <ChatBubbleIcon /> {totalComments.toLocaleString()}
                  </div>
                </div>
                <div>
                  {postReactions.map((r) => (
                    <span key={r.emoji}>{r.emoji}</span>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
