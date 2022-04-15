import React, { useEffect, useRef } from "react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";

import { requireUser, requireUserId } from "~/session.server";
import { updateUser, User } from "~/models/user.server";

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
  };
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const name = formData.get("name");

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
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
      className="p-4"
    >
      <h3>Stay awhile and listen...</h3>
      <p>
        Welcome to Vanguard! We just need a few details before we can unlock the
        gates..
      </p>
      <div>
        <label className="">
          <span>What should we call you?</span>
          <input
            ref={nameRef}
            name="name"
            className=""
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
        <button type="submit" className="btn btn-primary">
          Save Changes
        </button>
      </div>
    </Form>
  );
}
