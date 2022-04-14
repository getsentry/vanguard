import { Link } from "@remix-run/react";
import moment from "moment";
import styled from "styled-components";

import Content from "./content";
import PostLink from "./post-link";
import Markdown from "./markdown";
import CategoryTag from "./category-tag";

const PostWrapper = styled.article`
  h2 {
    font-size: 5rem;
    font-family: "Gazpacho-Heavy", serif;
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

const Avatar = styled.img`
  display: block;
  width: 48px;
  height: 48px;
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

const Date = styled.div`
  color: var(--gray500);
`;

export default function Post({ post }: { post: object }) {
  return (
    <PostWrapper>
      <CategoryTag category={post.category} />
      <h2>
        <PostLink post={post}>{post.title}</PostLink>
      </h2>
      <Credits>
        <Avatar src="/img/placeholder-avatar.png" />
        <Byline>
          <Name>
            <Link to={`/u/${post.author.email}`}>{post.author.name}</Link>
          </Name>
          <Date>{moment(post.publishedAt || post.createdAt).fromNow()}</Date>
        </Byline>
      </Credits>
      {!post.published && (
        <div className="py-6">
          <small>This post has not yet been published.</small>
        </div>
      )}
      <Content>
        <Markdown content={post.content || ""} />
      </Content>
    </PostWrapper>
  );
}
