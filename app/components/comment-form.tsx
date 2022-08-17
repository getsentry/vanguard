import { Form } from "@remix-run/react";

import Editor from "./editor";
import useLocalStorage from "~/lib/useLocalStorage";
import Button from "./button";
import HelpText from "./help-text";

export type CommentFormErrors = {
  comment?: string;
};

export type CommentFormInitialData = {
  comment?: string;
};

export default function CommentForm({
  errors,
  initialData,
}: {
  errors?: CommentFormErrors;
  initialData?: CommentFormInitialData;
}) {
  const [storedDraft, setStoredDraft] = useLocalStorage("comment", {});

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
      className="p-4"
      onSubmit={() => {
        setStoredDraft({});
      }}
      onChange={(e) => {
        setStoredDraft({ ...storedDraft, [e.target.name]: e.target.value });
      }}
    >
      <div>
        <Editor
          defaultValue={initialData?.comment}
          name="comment"
          minRows={5}
        />
        <HelpText>"Bad vibes don’t go with my outfit." - Anonymous</HelpText>
      </div>
      <div>
        <Button type="submit" mode="primary">
          Post Comment
        </Button>
      </div>
    </Form>
  );
}
