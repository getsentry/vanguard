import styled from "styled-components";
import { Link } from "@remix-run/react";

import Avatar from "./avatar";
import PostLink from "./post-link";
import { CategoryTagWrapper, CategoryTag } from "./category-tag";
import moment from "moment";
import Middot from "./middot";

const Byline = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-items: space-between;
  align-items: center;
  gap: 5px;
`;

const Name = styled.div`
  font-weight: 500;
`;

const Meta = styled.div`
  color: ${(p) => p.theme.textColorSecondary};
  flex-direction: row;
  display: flex;
  flex-grow: 1;
`;

const Date = styled.div``;

const Reactions = styled.div``;

const ClusterWrapper = styled.article`
  position: relative;
  margin-bottom: 3.2rem;

  > ul {
    border: 1px solid ${(p) => p.category.colorHex || "#000"};
    border-top: 0;
    margin: 0 1.6rem;
    padding: 0.8rem 1.6rem;
    list-style: none;

    > li {
      margin-bottom: 1.6rem;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  h3 {
    font-size: 2rem;
    font-family: "Gazpacho-Heavy", serif;
    margin: 0;
    a {
      color: inherit;
    }
  }

  ${CategoryTagWrapper} {
    width: 100%;
    justify-content: flex-start;
    margin-bottom: 0;
  }
`;

export default ({ category, posts, reactions }) => {
  return (
    <ClusterWrapper category={category}>
      <CategoryTag category={category} />
      <ul>
        {posts.map((post) => {
          const postReactions = reactions[post.id];
          const totalReactions = postReactions.reduce(
            (value, r) => value + r.total,
            0
          );
          return (
            <li key={post.id}>
              <h3>
                <PostLink post={post}>{post.title}</PostLink>
              </h3>
              <Byline>
                <Avatar size="24px" user={post.author} />

                <Name>
                  <Link to={`/u/${post.author.email}`}>{post.author.name}</Link>
                </Name>
                <Meta>
                  <Middot />
                  <Date>
                    {moment(post.publishedAt || post.createdAt).fromNow()}
                  </Date>
                  <Middot />
                  <div>
                    {totalReactions.toLocaleString()} reaction
                    {totalReactions !== 1 && "s"}
                  </div>
                </Meta>
                <Reactions>
                  {postReactions.map((r) => (
                    <span key={r.emoji}>{r.emoji}</span>
                  ))}
                </Reactions>
              </Byline>
            </li>
          );
        })}
      </ul>
    </ClusterWrapper>
  );
};