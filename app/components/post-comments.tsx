import { Link } from "@remix-run/react";
import moment from "moment";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { ResetIcon } from "@radix-ui/react-icons";

import Block from "~/components/block";
import Avatar from "./avatar";
import Button from "./button";
import CommentForm from "./comment-form";
import Markdown from "./markdown";
import Middot from "./middot";
import type { User } from "~/models/user.server";
import { PostQueryType } from "~/models/post.server";
import IconCollapsedPost from "~/icons/IconCollapsedPost";
import { PostComment } from "@prisma/client";

const Byline = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-items: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
  width: 100%;
`;

const Date = styled.div`
  color: ${(p) => p.theme.textColorSecondary};
`;

const Name = styled.div``;

const Controls = styled.div`
  flex-grow: 1;
  text-align: right;
`;

const Content = styled.div`
  overflow: auto;
`;

const CommentWrapper = styled.div``;

const StyledIconCollapsedPost = styled(IconCollapsedPost)`
  color: ${(p) => p.theme.borderColor};
`;

const CommentContainer = styled.div`
  display: flex;
  gap: 15px;
  flex-direction: row;
`;

const CommentBody = styled.div`
  flex-grow: 1;
  border-radius: 1rem;
  padding: 1.6rem 1.6rem 0;
  margin-bottom: 1.6rem;
  background: ${(p) => p.theme.bgLayer100};

  p,
  ul,
  ol,
  table,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-bottom: 1.6rem;
  }
`;

const CommentsHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 1.6rem;
  gap: 1.6rem;

  h3 {
    margin: 0;
  }
`;

const CommentsFormBlock = styled.div`
  marign-bottom: 1.6rem;
`;

const deleteComment = async (
  postId: string,
  commentId: string
): Promise<string | undefined> => {
  const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
    method: "DELETE",
  });
  if (res.status === 200) {
    return commentId;
  } else {
    alert("Unable to delete comment");
  }
};

const toggleSubscription = async (
  postId: string,
  active: boolean
): Promise<boolean | undefined> => {
  const res = await fetch(`/api/posts/${postId}/subscription`, {
    method: active ? "POST" : "DELETE",
  });
  if (res.status === 200) {
    return active;
  } else {
    alert("Unable to delete comment");
  }
};

const SubscribeButton = ({ postId, initialValue }) => {
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const label = value ? "Unsubscribe" : "Subscribe";

  return (
    <Button
      size="sm"
      onClick={async () => {
        setLoading(true);
        try {
          const active = await toggleSubscription(postId, !value);
          if (active !== undefined) {
            setValue(active);
          }
        } finally {
          setLoading(false);
        }
      }}
      disabled={loading}
    >
      {loading ? "..." : label}
    </Button>
  );
};

const Comment = ({
  comment,
  user,
  childList = [],
  onDelete,
  onReplyTo,
  asChild = false,
}: {
  comment: PostComment;
  user: User;
  childList?: PostComment[];
  onDelete: (comment: PostComment) => void;
  onReplyTo: (comment: PostComment) => void;
  asChild?: boolean;
}) => {
  const canDelete = user.admin || comment.authorId === user.id;
  return (
    <CommentWrapper id={`c_${comment.id}`}>
      <CommentContainer>
        {asChild && <StyledIconCollapsedPost />}
        <CommentBody>
          <Byline>
            <Avatar user={comment.author} size="24px" />
            <Name>
              <Link to={`/u/${comment.author.email}`}>
                {comment.author.name}
              </Link>
            </Name>
            <Middot />
            <Date>{moment(comment.createdAt).fromNow()}</Date>
            {canDelete && (
              <>
                <Middot />
                <Button baseStyle="link" onClick={() => onDelete(comment)}>
                  Delete
                </Button>
              </>
            )}
            <Controls>
              {!comment.parentId && (
                <Button
                  size="xs"
                  baseStyle="link"
                  onClick={() => onReplyTo(comment)}
                >
                  <ResetIcon />
                </Button>
              )}
            </Controls>
          </Byline>
          <Content>
            <Markdown content={comment.content} />
          </Content>
        </CommentBody>
      </CommentContainer>
      {childList.map((childComment) => {
        return (
          <Comment
            asChild
            key={childComment.id}
            comment={childComment}
            user={user}
            onDelete={onDelete}
            onReplyTo={onReplyTo}
          />
        );
      })}
    </CommentWrapper>
  );
};

export default ({
  post,
  comments,
  user,
  allowComments,
  hasSubscription,
}: {
  post: PostQueryType;
  comments: any[];
  user: User;
  allowComments: boolean;
  hasSubscription: boolean;
}) => {
  const [commentList, setCommentList] = useState(comments);

  useEffect(() => {
    setCommentList(comments);
  }, [comments]);

  const [inReplyTo, setInReplyTo] = useState<PostComment | null>(null);

  const onDeleteComment = async (comment: PostComment) => {
    if (await deleteComment(comment.postId, comment.id)) {
      setCommentList(commentList.filter((c) => c.id !== comment.id));
    }
  };

  const onReplyToComment = (comment: PostComment) => {
    setInReplyTo(comment);
  };

  const sortedCommentList: PostComment[] = [];
  const childCommentsByparent: { [commentId: string]: PostComment[] } = {};
  commentList.forEach((comment) => {
    if (comment.parentId) {
      if (!childCommentsByparent[comment.parentId])
        childCommentsByparent[comment.parentId] = [];
      childCommentsByparent[comment.parentId].push(comment);
    } else {
      sortedCommentList.push(comment);
    }
  });

  // TODO(dcramer): i've not bothered to optimize the loop mechanics on rendering because the dataset is
  // small and im lazy
  return (
    <Block>
      <CommentsHeader>
        <h3>Comments</h3>
        <SubscribeButton postId={post.id} initialValue={hasSubscription} />
      </CommentsHeader>
      <CommentsFormBlock>
        {allowComments ? (
          <CommentForm
            post={post}
            inReplyTo={inReplyTo}
            onInReplyTo={(comment) => setInReplyTo(comment || null)}
            onComment={(comment) => setCommentList([...commentList, comment])}
          />
        ) : (
          <p>Comments are disabled for this post.</p>
        )}
      </CommentsFormBlock>
      <div>
        {sortedCommentList.map((comment) => {
          return (
            <Comment
              key={comment.id}
              comment={comment}
              user={user}
              onDelete={onDeleteComment}
              onReplyTo={onReplyToComment}
              childList={childCommentsByparent[comment.id]}
            />
          );
        })}
      </div>
    </Block>
  );
};
