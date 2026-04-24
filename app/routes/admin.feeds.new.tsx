import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { Form, useActionData } from "react-router";

import { requireAdmin } from "~/services/auth.server";
import { db } from "~/db/client";
import { feeds } from "~/db/schema";
import FormActions from "~/components/form-actions";
import Button from "~/components/button";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const name = formData.get("name");
  const webhookUrl = formData.get("webhookUrl");
  const restricted = !!formData.get("restricted");

  if (typeof name !== "string" || name.length === 0) {
    return Response.json(
      { errors: { title: "Name is required" } },
      { status: 400 },
    );
  }

  await db
    .insert(feeds)
    .values({ name, webhookUrl: webhookUrl as string | null, restricted });

  return redirect("/admin/feeds");
}

export default function Index() {
  const actionData = useActionData<typeof action>();
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
        <label className="field-required">
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
            aria-invalid={errors?.url ? true : undefined}
            aria-errormessage={errors?.url ? "url-error" : undefined}
          />
        </label>
        {errors?.url && (
          <div className="pt-1 text-red-700" id="url-error">
            {errors.url}
          </div>
        )}
      </div>

      <div>
        <label>
          <span>Webhook URL</span>
          <input
            type="text"
            name="webhookUrl"
            required
            placeholder="e.g. https://blog.sentry.io/notify"
            autoFocus
            aria-invalid={errors?.webhookUrl ? true : undefined}
            aria-errormessage={
              errors?.webhookUrl ? "webhookUrl-error" : undefined
            }
          />
        </label>
        {errors?.webhookUrl && (
          <div className="pt-1 text-red-700" id="webhookUrl-error">
            {errors.webhookUrl}
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
