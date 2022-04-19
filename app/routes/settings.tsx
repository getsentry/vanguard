import React, { useEffect, useRef } from "react";
import {
  ActionFunction,
  LoaderFunction,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";

import { requireUser, requireUserId } from "~/session.server";
import { updateUser, User } from "~/models/user.server";
import uploadHandler from "~/lib/upload-handler";
import AvatarInput from "~/components/avatar-input";

type LoaderData = {
  user: User;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireUser(request);
  return json<LoaderData>({ user });
};

type ActionData = {
  errors?: {
    name?: string;
    picture?: string;
  };
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  const filter = ({ mimetype }: { mimetype: string }) => {
    return /image/i.test(mimetype);
  };

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler({
      fieldName: "picture",
      filter,
      namespace: userId,
      urlPrefix: "/image-uploads",
    })
  );
  const name = formData.get("name");
  const picture = formData.get("picture");

  if (typeof name !== "string" || name.length === 0) {
    return json<ActionData>(
      { errors: { name: "Name is required" } },
      { status: 400 }
    );
  }

  await updateUser({
    userId,
    id: userId,
    name,
    picture,
  });

  const url = new URL(request.url);
  let redirectTo = url.searchParams.get("redirectTo");
  if (redirectTo?.indexOf("/") !== 0) redirectTo = "/";
  return redirect(redirectTo);
};

export default function NewPostPage() {
  const { user } = useLoaderData() as LoaderData;
  const actionData = useActionData() as ActionData;
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
      <h1>Edit Profile</h1>
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
        <button type="submit" className="btn btn-primary">
          Save Changes
        </button>
      </div>
    </Form>
  );
}
