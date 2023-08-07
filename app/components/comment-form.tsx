import { Form } from "@remix-run/react";
import type { Post, PostComment } from "@prisma/client";

import Editor from "./editor";
import useLocalStorage from "~/lib/useLocalStorage";
import Button from "./button";
import HelpText from "./help-text";
import { useState } from "react";
import { Cross1Icon } from "@radix-ui/react-icons";

export type CommentFormErrors = {
  comment?: string;
};

export type CommentFormInitialData = {
  comment?: string;
};

const ParentComment = ({
  comment,
  onClear,
}: {
  comment?: PostComment;
  onClear: () => void;
}) => {
  if (!comment) return null;

  return (
    <div className="bg-layer100-light dark:bg-layer100-dark flex px-6 py-3 text-sm rounded-md bold">
      <input type="hidden" name="parentId" value={comment.id} />
      <p className="flex-grow">
        Replying to{" "}
        <a href={`#c_${comment.id}`}>
          {comment.author.name || comment.author.email}
        </a>
      </p>
      <Button size="xs" baseStyle="link" onClick={() => onClear()}>
        <Cross1Icon />
      </Button>
    </div>
  );
};

export default function CommentForm({
  post,
  errors,
  initialData,
  inReplyTo = null,
  onInReplyTo,
  onComment,
}: {
  post: Post;
  errors?: CommentFormErrors;
  initialData?: CommentFormInitialData;
  inReplyTo?: PostComment | null;
  onInReplyTo: (comment?: PostComment) => void;
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
            onInReplyTo(null);
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
            onInReplyTo(null);
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
