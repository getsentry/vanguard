import { Form, Link } from "@remix-run/react";
import moment from "moment";
import styled from "styled-components";
import breakpoint from "styled-components-breakpoint";

import Avatar from "./avatar";
import Content from "./content";
import PostLink, { getPostLink } from "./post-link";
import Markdown from "./markdown";
import { CategoryTagWrapper, CategoryTag } from "./category-tag";
import type { Post as PostType } from "~/models/post.server";
import Middot from "./middot";
import DefinitionList from "./definition-list";
import { Fragment } from "react";
import ButtonDropdown, { ButtonDropdownItem } from "./button-dropdown";
import HelpText from "./help-text";
import { ChatBubbleIcon, HeartIcon } from "@radix-ui/react-icons";

const PostTitle = styled.h1`
  font-size: 4.4rem;
  font-family: "Gazpacho-Heavy", serif;
  overflow-wrap: break-word;

  a {
    color: inherit;
  }
`;

const PostWrapper = styled.article`
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

const Reactions = styled.div`
  flex-grow: 1;
  text-align: right;
`;

const ReactionCount = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
`;

const CommentCount = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
`;

const Date = styled.div``;

const ReadingTime = styled.div``;

const URL_REGEXP = new RegExp(
  /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g
);

const isUrl = (value: string) => value.match(URL_REGEXP);

const SyndicationNote = styled.div`
  color: ${(p) => p.theme.textColorSecondary};
  font-size: 1.4rem;
`;

const DraftNoteForm = styled(Form)`
  border-radius: 15rem;
  padding: 1.6rem;
  background: ${(p) => p.theme.alert.backgroundColor};
  color: ${(p) => p.theme.alert.textColor};
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-bottom: 3rem;
  gap: 1.6rem;

  p {
    font-size: 1.6rem;
    margin: 0;
  }

  form {
    margin: 0;
  }
`;

const DraftNote = ({ post }: { post: PostType }) => {
  return (
    <DraftNoteForm method="post" action={`${getPostLink(post)}/edit`}>
      <p>
        This post has not been published, and is only visible if you have the
        link.
      </p>
      <ButtonDropdown
        type="submit"
        mode="primary"
        name="published"
        value="announce"
        label="Publish"
      >
        <ButtonDropdownItem type="submit" name="published" value="announce">
          Publish
        </ButtonDropdownItem>
        <ButtonDropdownItem type="submit" name="published" value="true">
          Publish Silently
          <HelpText>Don't send announcements (if configured).</HelpText>
        </ButtonDropdownItem>
      </ButtonDropdown>
    </DraftNoteForm>
  );
};

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
    <PostWrapper>
      <CategoryTag category={post.category} />
      <PostTitle>
        <PostLink post={post}>{post.title}</PostLink>
      </PostTitle>
      <Credits>
        <Avatar user={post.author} />
        <Byline>
          <Name>
            <Link to={`/u/${post.author.email}`}>{post.author.name}</Link>
          </Name>
          <Meta>
            <Date>{moment(post.publishedAt || post.createdAt).fromNow()}</Date>
            {summary && totalComments !== undefined && (
              <>
                <Middot />
                <ReactionCount>
                  <HeartIcon /> {totalReactions.toLocaleString()}
                </ReactionCount>
                <Middot />
                <CommentCount>
                  <ChatBubbleIcon /> {totalComments.toLocaleString()}
                </CommentCount>
              </>
            )}
            {!summary && (
              <>
                <Middot />
                <ReadingTime>
                  {readingTime(post.content || "", false)} read
                </ReadingTime>
              </>
            )}
            {canEdit && (
              <>
                <Middot />
                <Link to={`/p/${post!.id}/edit`}>Edit</Link>
              </>
            )}
            {summary && (
              <Reactions>
                {reactions?.map((r) => (
                  <span key={r.emoji}>{r.emoji}</span>
                ))}
              </Reactions>
            )}
          </Meta>
        </Byline>
      </Credits>
      {!post.published && <DraftNote post={post} />}
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
      {post.published && !summary && !!post.feeds.length && (
        <SyndicationNote>
          Syndicated to{" "}
          <CommaSeparated>
            {post.feeds.map((f) =>
              f.url ? (
                <a href={f.url} key={f.id}>
                  {f.name}
                </a>
              ) : (
                f.name
              )
            )}
          </CommaSeparated>
        </SyndicationNote>
      )}
    </PostWrapper>
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
