import { useEffect, useRef } from "react";
import {
  unstable_parseMultipartFormData,
  json,
  redirect,
} from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";

import { requireUserId } from "~/services/auth.server";
import { getUserById, updateUser } from "~/models/user.server";
import uploadHandler from "~/lib/upload-handler";
import AvatarInput from "~/components/avatar-input";
import FormActions from "~/components/form-actions";
import Button from "~/components/button";
import PageHeader from "~/components/page-header";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const userId = await requireUserId(request, context);

  const user = await getUserById(userId);

  return json({ user });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const userId = await requireUserId(request, context);

  const filter = ({ contentType }: { contentType: string }) => {
    return /image/i.test(contentType);
  };

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler({
      fieldName: "picture",
      filter,
      namespace: userId,
      urlPrefix: "/image-uploads",
    }),
  );
  const name = formData.get("name");
  const notifyReplies = !!formData.get("notifyReplies");
  let picture: any = formData.get("picture");
  // empty values get returned as empty strings, which will unset
  // the picture rather than leave it unchanged
  if (picture === "") picture = undefined;

  if (typeof name !== "string" || name.length === 0) {
    return json({ errors: { name: "Name is required" } }, { status: 400 });
  }

  // TODO: update session
  await updateUser({
    userId,
    id: userId,
    name,
    picture,
    notifyReplies,
  });

  const url = new URL(request.url);
  let redirectTo = url.searchParams.get("redirectTo");
  if (redirectTo?.indexOf("/") !== 0) redirectTo = "/";
  return redirect(redirectTo);
}

export default function Settings() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errors = actionData?.errors;

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (errors?.name) {
      nameRef.current?.focus();
    }
  }, [errors]);

  return (
    <Form
      method="post"
      encType="multipart/form-data"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
      className="p-4"
    >
      <PageHeader title="Edit Profile">
        <Form action="/logout" method="post">
          <Button type="submit" size="sm">
            Logout
          </Button>
        </Form>
        <Button as={Link} to={`/u/${user.email}`} size="sm">
          View Your Profile
        </Button>
      </PageHeader>
      <div>
        <label>
          <span>What should we call you?</span>
          <input
            ref={nameRef}
            type="text"
            name="name"
            required
            placeholder="Jane Doe"
            autoFocus
            defaultValue={user.name || ""}
            aria-invalid={errors?.name ? true : undefined}
            aria-errormessage={errors?.name ? "name-error" : undefined}
          />
        </label>
        {errors?.name && (
          <div className="pt-1 text-red-700" id="name-error">
            {errors.name}
          </div>
        )}
      </div>
      <div>
        <label>
          <span>How about a slick way to visually identify yourself?</span>
          <AvatarInput
            initialValue={user.picture}
            name="picture"
            error={errors?.picture}
          />
        </label>
        {errors?.picture && (
          <div className="pt-1 text-red-700" id="picture-error">
            {errors.picture}
          </div>
        )}
      </div>
      <div>
        <label className="field-inline">
          <input
            type="checkbox"
            name="notifyReplies"
            defaultChecked={user.notifyReplies}
          />
          Receive notifications about replies to your comments?
        </label>
      </div>
      <FormActions>
        <Button type="submit" mode="primary">
          Save Changes
        </Button>
      </FormActions>
    </Form>
  );
}
