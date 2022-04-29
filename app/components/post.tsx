import { Link } from "@remix-run/react";
import moment from "moment";
import styled from "styled-components";

import Avatar from "./avatar";
import Content from "./content";
import PostLink from "./post-link";
import Markdown from "./markdown";
import { TagWrapper, CategoryTag } from "./category-tag";
import type { PostQueryType } from "~/models/post.server";

const PostWrapper = styled.article`
  position: relative;
  margin-bottom: 3.2rem;
  h2 {
    font-size: 5rem;
    font-family: "Gazpacho-Heavy", serif;

    a {
      color: inherit;
    }
  }
  ${TagWrapper} {
    position: absolute;
    right: calc(100% + 4rem);
    top: 0.75rem;
    width: 100rem;

    span {
      display: none;
    }
  }

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

const Date = styled.div``;

const ReadingTime = styled.div``;

const Middot = styled((props) => <div {...props}>&middot;</div>)`
  margin: 0 5px;
`;

export default function Post({
  post,
  summary = false,
}: {
  post: PostQueryType;
  summary?: boolean;
}) {
  return (
    <PostWrapper>
      <CategoryTag category={post.category} />
      <h2>
        <PostLink post={post}>{post.title}</PostLink>
      </h2>
      <Credits>
        <Avatar src={post.author.picture || "/img/placeholder-avatar.png"} />
        <Byline>
          <Name>
            <Link to={`/u/${post.author.email}`}>{post.author.name}</Link>
          </Name>
          <Meta>
            <Date>{moment(post.publishedAt || post.createdAt).fromNow()}</Date>
            {!summary && [
              <Middot />,
              <ReadingTime>
                {readingTime(post.content || "", false)} read
              </ReadingTime>,
            ]}
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
    </PostWrapper>
  );
}

const readingTime = (content: string, plural: boolean = true): string => {
  const time = Math.ceil(content.length / 2000);
  if (time > 60)
    return time / 60 + " hour" + (plural && time / 60 > 1 ? "s" : "");
  return time + " minute" + (plural && time > 1 ? "s" : "");
};
