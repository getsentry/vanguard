import { Form } from "@remix-run/react";
import { PostComment } from "@prisma/client";

import Editor from "./editor";
import useLocalStorage from "~/lib/useLocalStorage";
import Button from "./button";
import HelpText from "./help-text";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { Cross1Icon } from "@radix-ui/react-icons";

export type CommentFormErrors = {
  comment?: string;
};

export type CommentFormInitialData = {
  comment?: string;
};

const ParentCommentContainer = styled.div`
  background: ${(p) => p.theme.bgLayer100};
  display: flex;
  padding: 0.8rem 1.6rem;
  font-size: 0.8em;
  border-radius: 5px;
  font-weight: bold;

  p {
    flex-grow: 1;
    margin: 0;
    font-size: inherit;
  }
`;

const ParentComment = ({
  comment,
  onClear,
}: {
  comment?: PostComment;
  onClear: () => void;
}) => {
  if (!comment) return null;

  return (
    <ParentCommentContainer>
      <input type="hidden" name="parentId" value={comment.id} />
      <p>
        Replying to <a href={`#c_${comment.id}`}>{comment.author.name}</a>
      </p>
      <Button size="xs" baseStyle="link" onClick={() => onClear()}>
        <Cross1Icon />
      </Button>
    </ParentCommentContainer>
  );
};

export default function CommentForm({
  post,
  errors,
  initialData,
  inReplyTo = null,
  onInReplayTo,
  onComment,
}: {
  post: Post;
  errors?: CommentFormErrors;
  initialData?: CommentFormInitialData;
  inReplyTo?: PostComment | null;
  onInReplayTo: (comment?: PostComment) => void;
  onComment: (comment?: PostComment) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [storedDraft, setStoredDraft] = useLocalStorage(`{c:${post.id}`, {});
  if (!initialData) {
    initialData = storedDraft;
  }

  return (
    <Form
      method="post"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
      onSubmit={async (e) => {
        e.preventDefault();

        setLoading(true);
        try {
          const data = new FormData(e.target);
          const res = await fetch(`/api/posts/${post.id}/comments`, {
            method: "POST",
            body: JSON.stringify({
              content: data.get("comment"),
              parentId: data.get("parentId"),
            }),
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (res.status === 200) {
            setStoredDraft({});
            onComment(await res.json());
          }
        } finally {
          setLoading(false);
        }
      }}
      onChange={(e) => {
        setStoredDraft({ ...storedDraft, [e.target.name]: e.target.value });
      }}
    >
      <fieldset disabled={loading}>
        <div>
          <Editor
            defaultValue={initialData?.comment}
            name="comment"
            minRows={5}
            noPreview
          />
          <HelpText>"Bad vibes don’t go with my outfit." - Anonymous</HelpText>
        </div>
        <ParentComment
          comment={inReplyTo}
          onClear={() => {
            onInReplayTo(null);
          }}
        />
      </fieldset>
      <div>
        <Button type="submit" mode="primary" disabled={loading}>
          {loading ? "..." : "Post Comment"}
        </Button>
      </div>
    </Form>
  );
}
