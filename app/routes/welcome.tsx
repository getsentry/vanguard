import { useEffect, useRef } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";

import { requireUser, requireUserId } from "~/services/auth.server";
import { updateUser } from "~/models/user.server";
import { uploadFile } from "~/lib/upload-handler";
import AvatarInput from "~/components/avatar-input";
import Button from "~/components/button";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  return { user };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const name = formData.get("name");
  if (typeof name !== "string" || name.length === 0) {
    return Response.json(
      { errors: { name: "Name is required" } },
      { status: 400 },
    );
  }

  const pictureFile = formData.get("picture");
  let picture: string | undefined = undefined;
  if (
    pictureFile instanceof File &&
    pictureFile.size > 0 &&
    pictureFile.type.startsWith("image/")
  ) {
    const buffer = Buffer.from(await pictureFile.arrayBuffer());
    const { url } = await uploadFile({
      filename: pictureFile.name,
      buffer,
      namespace: userId,
    });
    picture = url;
  }

  await updateUser({
    userId,
    id: userId,
    name,
    picture,
  });

  const url = new URL(request.url);
  let redirectTo = url.searchParams.get("redirectTo");
  // only redirect to same domain
  if (redirectTo?.indexOf("/") !== 0) redirectTo = "/";
  // dont redirect to self
  else if (redirectTo?.indexOf("/welcome") === 0) redirectTo = "/";
  return redirect(redirectTo);
}

export default function WelcomePage() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData() as
    | { errors?: Record<string, any> }
    | undefined;
  const errors = actionData?.errors;

  const nameRef = useRef<HTMLInputElement>(null);
  const pictureRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (errors?.name) {
      nameRef.current?.focus();
    } else if (errors?.picture) {
      pictureRef.current?.focus();
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
      <h1>Stay awhile and listen...</h1>
      <p>
        Welcome to Vanguard! We just need a few details before we can unlock the
        gates..
      </p>
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
      </div>
      <div>
        <Button type="submit" mode="primary">
          Let's Go
        </Button>
      </div>
    </Form>
  );
}
