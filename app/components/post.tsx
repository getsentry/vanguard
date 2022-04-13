import { Link } from "@remix-run/react";
import moment from "moment";
import styled from "styled-components";

import Content from "./content";
import PostLink from "./post-link";
import Markdown from "./markdown";
import Tag from "./tag";

export default function Post({ post }: { post: object }) {
  return (
    <article className="post">
      <Tag category={post.category.slug} />
      <h2>
        <PostLink post={post}>{post.title}</PostLink>
      </h2>
      <Credits>
        <Avatar src="/img/placeholder-avatar.png" />
        <Byline>
          <Name>
            <Link to={`/u/${post.author.email}`}>{post.author.name}</Link>
          </Name>
          <Date>{moment(post.createdAt).fromNow()}</Date>
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
    </article>
  );
}

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
