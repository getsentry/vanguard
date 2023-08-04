import type { Post } from "@prisma/client";
import { Form } from "@remix-run/react";

import { getPostLink } from "./post-link";
import ButtonDropdown, { ButtonDropdownItem } from "./button-dropdown";
import HelpText from "./help-text";

export default function DraftNote({ post }: { post: Post }) {
  return (
    <Form
      className="rounded-full p-6 bg-violet-900 text-white flex justify-center items-center mb-12 gap-6"
      method="post"
      action={`${getPostLink(post)}/edit`}
    >
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
    </Form>
  );
}
