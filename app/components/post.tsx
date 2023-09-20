import Avatar from "./avatar";
import Content from "./content";
import PostLink from "./post-link";
import Markdown from "./markdown";
import CategoryTag from "./category-tag";
import type { Post as PostType } from "~/models/post.server";
import Middot from "./middot";
import DefinitionList from "./definition-list";
import { Fragment } from "react";
import { ChatBubbleIcon, HeartIcon } from "@radix-ui/react-icons";
import TimeSince from "./timeSince";
import DraftNote from "./draft-note";
import Link from "./link";

const URL_REGEXP = new RegExp(
  /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g,
);

const isUrl = (value: string) => value.match(URL_REGEXP);

export default function Post({
  post,
  summary = false,
  canEdit = false,
  reactions,
  totalComments,
}: {
  post: PostType;
  summary?: boolean;
  canEdit?: boolean;
  reactions?: any[];
  totalComments?: number;
}) {
  const totalReactions =
    reactions?.reduce((value, r) => value + r.total, 0) || 0;

  return (
    <div className="post">
      <CategoryTag category={post.category} />
      <h1 className="font-serif break-words text-4xl mb-6">
        <PostLink post={post}>{post.title}</PostLink>
      </h1>
      <div className="flex font-mono gap-5 mb-6">
        <Avatar user={post.author} />
        <div className="flex flex-1 flex-col justify-between">
          <div className="font-medium">
            <Link to={`/u/${post.author.email}`}>
              {post.author.name || post.authorId.email}
            </Link>
          </div>
          <div className="text-muted-light dark:text-muted-dark flex">
            <div>
              <TimeSince date={post.publishedAt || post.createdAt} />
            </div>
            {summary && totalComments !== undefined && (
              <>
                <Middot />
                <div className="flex items-center gap-2">
                  <HeartIcon /> {totalReactions.toLocaleString()}
                </div>
                <Middot />
                <div className="flex items-center gap-2">
                  <ChatBubbleIcon /> {totalComments.toLocaleString()}
                </div>
              </>
            )}
            {!summary && (
              <>
                <Middot />
                <div>{readingTime(post.content || "", false)} read</div>
              </>
            )}
            {canEdit && (
              <>
                <Middot />
                <Link to={`/p/${post!.id}/edit`}>Edit</Link>
              </>
            )}
            {summary && (
              <div className="text-right flex-grow">
                {reactions?.map((r) => <span key={r.emoji}>{r.emoji}</span>)}
              </div>
            )}
          </div>
        </div>
      </div>
      {!post.published && <DraftNote post={post} />}
      <Content>
        <Markdown content={post.content || ""} summarize={summary} />
      </Content>
      {!!summary && (
        <PostLink post={post} color="default">
          Read more ({readingTime(post.content || "")})
        </PostLink>
      )}
      {!summary && !!post.meta.length && (
        <DefinitionList>
          {post.meta
            .filter((m) => !!m.content)
            .map((meta) => (
              <Fragment key={meta.id}>
                <DefinitionList.Term>{meta.name}</DefinitionList.Term>
                <DefinitionList.Desc>
                  {isUrl(meta.content) ? (
                    <a href={meta.content}>{meta.content}</a>
                  ) : (
                    meta.content
                  )}
                </DefinitionList.Desc>
              </Fragment>
            ))}
        </DefinitionList>
      )}
      {post.published && !summary && !!post.feeds.length && (
        <div className="text-muted-light dark:text-muted-dark text-xl">
          Syndicated to{" "}
          <CommaSeparated>
            {post.feeds.map((f) =>
              f.url ? (
                <a
                  href={f.url}
                  key={f.id}
                  className="text-link-light dark:text-link-dark hover:underline"
                >
                  {f.name}
                </a>
              ) : (
                f.name
              ),
            )}
          </CommaSeparated>
        </div>
      )}
    </div>
  );
}

const CommaSeparated = ({ children }) => {
  const numChild = children.length;
  if (numChild > 1) {
    return (
      <>
        {children.map((c, idx) => {
          return (
            <>
              {c}
              {numChild - 1 !== idx ? ", " : ""}
            </>
          );
        })}
      </>
    );
  }
  return children;
};

const readingTime = (content: string, plural: boolean = true): string => {
  const time = Math.ceil(content.length / 2000);
  if (time > 60)
    return time / 60 + " hour" + (plural && time / 60 > 1 ? "s" : "");
  return time + " minute" + (plural && time > 1 ? "s" : "");
};
