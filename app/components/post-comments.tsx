import { Link } from "@remix-run/react";
import moment from "moment";
import { useEffect, useState } from "react";
import styled from "styled-components";

import Block from "~/components/block";
import Avatar from "./avatar";
import Button from "./button";
import CommentForm from "./comment-form";
import Markdown from "./markdown";
import Middot from "./middot";
import type { User } from "~/models/user.server";
import { PostQueryType } from "~/models/post.server";

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

const Comment = styled.div`
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
  margin-bottom: 3rem;

  h3 {
    flex-grow: 1;
    margin: 0;
  }

  ${Button} {
    justify-self: flex-end;
  }
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

  return (
    <Block>
      <CommentsHeader>
        <h3>Comments</h3>
        <SubscribeButton postId={post.id} initialValue={hasSubscription} />
      </CommentsHeader>
      {allowComments ? (
        <CommentForm />
      ) : (
        <p>Comments are disabled for this post.</p>
      )}
      <div>
        {commentList.map((comment) => {
          return (
            <Comment key={comment.id} id={`c_${comment.id}`}>
              <Byline>
                <Avatar user={comment.author} size="24px" />
                <Name>
                  <Link to={`/u/${comment.author.email}`}>
                    {comment.author.name}
                  </Link>
                </Name>
                <Middot />
                <Date>{moment(comment.createdAt).fromNow()}</Date>
                {(user.admin || comment.authorId === user.id) && (
                  <Controls>
                    <Button
                      size="xs"
                      onClick={async () => {
                        if (await deleteComment(comment.postId, comment.id)) {
                          setCommentList(
                            commentList.filter((c) => c.id !== comment.id)
                          );
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </Controls>
                )}
              </Byline>
              <Content>
                <Markdown content={comment.content} />
              </Content>
            </Comment>
          );
        })}
      </div>
    </Block>
  );
};
