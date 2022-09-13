import type { ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";

import { requireAdmin } from "~/services/auth.server";
import { prisma } from "~/services/db.server";
import FormActions from "~/components/form-actions";
import Button from "~/components/button";

type ActionData = {
  errors?: {
    name?: string;
    slug?: string;
    colorHex?: string;
    slackConfig?: {
      webhookUrl?: string;
    };
    emailConfig?: {
      to?: string;
    };
  };
};

export const loader: LoaderFunction = async ({ request }) => {
  await requireAdmin(request);

  return null;
};

export const action: ActionFunction = async ({ request, params }) => {
  await requireAdmin(request);
  const formData = await request.formData();
  const name = formData.get("name");
  const restricted = !!formData.get("restricted");

  if (typeof name !== "string" || name.length === 0) {
    return json<ActionData>(
      { errors: { title: "Name is required" } },
      { status: 400 }
    );
  }

  const queries: any[] = [
    prisma.feed.create({
      data: {
        name,
        restricted,
      },
    }),
  ];

  await prisma.$transaction(queries);

  return redirect("/admin/feeds");
};

export default function Index() {
  const actionData = useActionData() as ActionData;
  const errors = actionData?.errors;

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
      <h1>Create Feed</h1>
      <div>
        <label>
          <span>Name</span>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. blog.sentry.io"
            autoFocus
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
        <label className="field-required">
          <span>External URL</span>
          <input
            type="text"
            name="url"
            required
            placeholder="e.g. https://blog.sentry.io"
            autoFocus
            defaultValue={feed.url || ""}
            aria-invalid={errors?.url ? true : undefined}
            aria-errormessage={errors?.name ? "url-error" : undefined}
          />
        </label>
        {errors?.url && (
          <div className="pt-1 text-red-700" id="url-error">
            {errors.url}
          </div>
        )}
      </div>

      <div>
        <label className="field-inline">
          <input type="checkbox" name="restricted" />
          Restrict syndication to this feed
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
