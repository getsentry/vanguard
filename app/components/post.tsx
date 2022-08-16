import { Link } from "@remix-run/react";
import moment from "moment";
import styled from "styled-components";
import breakpoint from "styled-components-breakpoint";

import Avatar from "./avatar";
import Content from "./content";
import PostLink from "./post-link";
import Markdown from "./markdown";
import { CategoryTagWrapper, CategoryTag } from "./category-tag";
import type { PostQueryType } from "~/models/post.server";
import Middot from "./middot";
import DefinitionList from "./definition-list";
import { Fragment } from "react";

const PostWrapper = styled.article`
  position: relative;
  margin-bottom: 3.2rem;
  h2 {
    font-size: 4.4rem;
    font-family: "Gazpacho-Heavy", serif;

    a {
      color: inherit;
    }
  }

  ${breakpoint("desktop")`
    ${CategoryTagWrapper} {
      position: absolute;
      right: calc(100% + 4rem);
      top: 0.2rem;
      width: 100rem;

      span {
        display: none;
      }
    }
  `}

  & + & {
    margin-top: 4.8rem;
  }
`;

const Credits = styled.div`
  display: flex;
  font-family: "IBM Plex Mono", monospace;
  font-size: 1.6rem;
  line-height: 1.5;
  gap: 1.2rem;
  margin-bottom: 3rem;
`;

const Byline = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-items: space-between;
`;

const Name = styled.div`
  font-weight: 500;
`;

const Meta = styled.div`
  color: ${(p) => p.theme.textColorSecondary};
  flex-direction: row;
  display: flex;
`;

const ReactionCount = styled.div``;

const Date = styled.div``;

const ReadingTime = styled.div``;

const URL_REGEXP = new RegExp(
  /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g
);

const isUrl = (value: string) => value.match(URL_REGEXP);

export default function Post({
  post,
  summary = false,
  canEdit = false,
  totalReactions,
}: {
  post: PostQueryType;
  summary?: boolean;
  canEdit?: boolean;
  totalReactions?: number;
}) {
  return (
    <PostWrapper>
      <CategoryTag category={post.category} />
      <h2>
        <PostLink post={post}>{post.title}</PostLink>
      </h2>
      <Credits>
        <Avatar user={post.author} />
        <Byline>
          <Name>
            <Link to={`/u/${post.author.email}`}>{post.author.name}</Link>
          </Name>
          <Meta>
            <Date>{moment(post.publishedAt || post.createdAt).fromNow()}</Date>
            {!summary && (
              <>
                <Middot />
                <ReadingTime>
                  {readingTime(post.content || "", false)} read
                </ReadingTime>
              </>
            )}
            {totalReactions > 0 && (
              <>
                <Middot />
                <ReactionCount>
                  {totalReactions.toLocaleString()} ♡'s
                </ReactionCount>
              </>
            )}
            {canEdit && (
              <>
                <Middot />
                <Link to={`/p/${post!.id}/edit`}>Edit</Link>
              </>
            )}
          </Meta>
        </Byline>
      </Credits>
      {!post.published && (
        <div className="py-6">
          <strong>This post has not yet been published.</strong>
        </div>
      )}
      <Content>
        <Markdown content={post.content || ""} summarize={summary} />
      </Content>
      {!!summary && (
        <PostLink post={post}>
          Read more ({readingTime(post.content || "")})
        </PostLink>
      )}
      {!summary && !!post.meta.length && (
        <DefinitionList>
          {post.meta
            .filter((m) => !!m.content)
            .map((meta) => (
              <Fragment key={meta.id}>
                <dt>{meta.name}</dt>
                <dd>
                  {isUrl(meta.content) ? (
                    <a href={meta.content}>{meta.content}</a>
                  ) : (
                    meta.content
                  )}
                </dd>
              </Fragment>
            ))}
        </DefinitionList>
      )}
    </PostWrapper>
  );
}

const readingTime = (content: string, plural: boolean = true): string => {
  const time = Math.ceil(content.length / 2000);
  if (time > 60)
    return time / 60 + " hour" + (plural && time / 60 > 1 ? "s" : "");
  return time + " minute" + (plural && time > 1 ? "s" : "");
};
