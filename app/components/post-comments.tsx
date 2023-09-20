import { useEffect, useState } from "react";
import { ResetIcon } from "@radix-ui/react-icons";

import Block from "~/components/block";
import Avatar from "./avatar";
import Button from "./button";
import CommentForm from "./comment-form";
import Markdown from "./markdown";
import Middot from "./middot";
import type { User } from "~/models/user.server";
import type { PostQueryType } from "~/models/post.server";
import IconCollapsedPost from "~/icons/IconCollapsedPost";
import type { PostComment } from "@prisma/client";
import TimeSince from "./timeSince";
import Link from "./link";

const deleteComment = async (
  postId: string,
  commentId: string,
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
  active: boolean,
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
    <div id={`c_${comment.id}`}>
      <div className="flex gap-4">
        {asChild && (
          <IconCollapsedPost className="text-border-light dark:text-border-dark" />
        )}
        <div className="flex-1 rounded pt-4 px-4 mb-4 bg-layer100-light dark:bg-layer100-dark">
          <div className="flex flex-1 justify-between items-center gap-1 mb-2 w-full">
            <Avatar user={comment.author} size="24px" />
            <Link to={`/u/${comment.author.email}`}>
              {comment.author.name || comment.author.email}
            </Link>
            <Middot />
            <div className="text-secondary-light dark:text-secondary-dark">
              <TimeSince date={comment.createdAt} />
            </div>
            {canDelete && (
              <>
                <Middot />
                <Button baseStyle="link" onClick={() => onDelete(comment)}>
                  Delete
                </Button>
              </>
            )}
            <div className="flex-1 text-right">
              {!comment.parentId && (
                <Button
                  size="xs"
                  baseStyle="link"
                  onClick={() => onReplyTo(comment)}
                >
                  <ResetIcon />
                </Button>
              )}
            </div>
          </div>
          <div className="overflow-auto prose dark:prose-invert prose-a:text-link-light dark:prose-a:text-link-dark max-w-none">
            <Markdown content={comment.content} />
          </div>
        </div>
      </div>
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
    </div>
  );
};

export default function PostComments({
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
}) {
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
    <Block className="print:hidden">
      <div className="flex items-center mb-6 gap-6">
        <h3 className="text-2xl font-bold">Comments</h3>
        <SubscribeButton postId={post.id} initialValue={hasSubscription} />
      </div>
      <div className="mb-6">
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
      </div>
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
}
