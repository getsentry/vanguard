import styled from "styled-components";
import breakpoint from "styled-components-breakpoint";
import { Link } from "@remix-run/react";

import Avatar from "./avatar";
import PostLink from "./post-link";
import { CategoryTagWrapper, CategoryTag } from "./category-tag";
import moment from "moment";
import Middot from "./middot";
import IconCollapsedPost from "~/icons/IconCollapsedPost";

const Byline = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-items: space-between;
  align-items: center;
  gap: 5px;
  font-family: "IBM Plex Mono", monospace;
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

// make icon eligible for interpolation
const StyledIconCollapsedPost = styled(IconCollapsedPost)``;

const Date = styled.div``;

const Reactions = styled.div``;

const ClusterWrapper = styled.article`
  position: relative;
  margin-bottom: 3.2rem;

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

    margin-top: 4.8rem;

  > ul {
    list-style: none;
    margin: 0;
    padding: 0;

    > li {
      margin-bottom: 2.4rem;
      padding: 0;
      position: relative;

      &:first-child {
        ${StyledIconCollapsedPost} {
          display: none;
        }
      }

      &:last-child {
        margin-bottom: 0;
      }

      ${StyledIconCollapsedPost} {
        /* Hide on mobile */
        display: none;

        ${breakpoint("desktop")`
          color: ${(p) => p.theme.borderColor};
          display: block;
          position: absolute;

          /* Icon size + gutter size */
          left: calc(-19px + -4rem);
          top: -.4rem;
        `}
    }
  }

  h3 {
    font-size: 2.6rem;
    font-family: "Gazpacho-Heavy", serif;
    margin-bottom: .4rem;
    a {
      color: inherit;
    }
  }
`;

export default ({ category, posts, reactions, commentCounts }) => {
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
          const totalComments = commentCounts[post.id];
          return (
            <li key={post.id}>
              <StyledIconCollapsedPost />
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
                  <Middot />
                  <div>
                    {totalComments.toLocaleString()} comment
                    {totalComments !== 1 && "s"}
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
