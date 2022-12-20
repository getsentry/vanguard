import { Link } from "@remix-run/react";
import moment from "moment";
import styled from "styled-components";

import PostLink from "~/components/post-link";
import Avatar from "~/components/avatar";

const PostListContainer = styled.ul`
  list-style: none;
  margin-left: 0;
  padding: 0;
`;

const PostListItem = styled.li`
  display: grid;
  grid-template-columns: 4.8rem auto;
  grid-template-areas:
    "avatar title"
    "avatar credits";
  grid-column-gap: 0.8rem;
  margin-bottom: 1rem;
  padding: 0;
`;

const PostTitle = styled.h4`
  grid-area: title;
  margin: 0;
  font-size: 1.6rem;
  overflow-wrap: break-word;
`;

const PostCredits = styled.div`
  grid-area: credits;
  display: flex;
  flex-direction: row;
  gap: 0.8rem;
  align-items: center;

  font-family: "IBM Plex Mono", monospace;
  color: ${(p) => p.theme.textColorSecondary};
`;

const PostAvatar = styled.div`
  grid-area: avatar;
`;

const PostAuthor = styled.strong`
  font-size: 1.4rem;
  font-weight: 500;

  a {
    color: inherit;
  }
`;

const PostDate = styled.time`
  margin-left: 5px;
  font-size: 1.2rem;
`;

export default function PostList({ postList }) {
  return (
    <PostListContainer>
      {postList.map((post) => (
        <PostListItem key={post.id}>
          <PostTitle>
            <PostLink post={post}>{post.title}</PostLink>
          </PostTitle>
          <PostAvatar>
            <Avatar user={post.author} />
          </PostAvatar>
          <PostCredits>
            <PostAuthor>
              <Link to={`/u/${post.author.email}`}>{post.author.name}</Link>
            </PostAuthor>
            <PostDate>{moment(post.publishedAt).fromNow()}</PostDate>
          </PostCredits>
        </PostListItem>
      ))}
    </PostListContainer>
  );
}
