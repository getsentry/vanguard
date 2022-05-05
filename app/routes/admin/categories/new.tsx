import type { ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";

import { requireAdmin } from "~/session.server";
import { prisma } from "~/db.server";

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

export const action: ActionFunction = async ({ request, params }) => {
  await requireAdmin(request);
  const formData = await request.formData();
  const name = formData.get("name");
  const slug = formData.get("slug");
  const colorHex = formData.get("colorHex");
  const restricted = !!formData.get("restricted");
  const slackWebhookUrl = formData.get("slack.webhookUrl");
  const emailTo = formData.get("email.to");

  if (typeof name !== "string" || name.length === 0) {
    return json<ActionData>(
      { errors: { title: "Name is required" } },
      { status: 400 }
    );
  }

  if (typeof slug !== "string" || slug.length === 0) {
    return json<ActionData>(
      { errors: { title: "Slug is required" } },
      { status: 400 }
    );
  }

  // TODO: validate
  if (typeof colorHex !== "string" || colorHex.length === 0) {
    return json<ActionData>(
      { errors: { title: "Color is required" } },
      { status: 400 }
    );
  }

  const queries: any[] = [
    prisma.category.create({
      data: {
        name,
        slug,
        colorHex,
        restricted,
        slackConfig: slackWebhookUrl
          ? {
              create: [
                {
                  webhookUrl: slackWebhookUrl,
                },
              ],
            }
          : {},
        emailConfig: emailTo
          ? {
              create: [
                {
                  to: emailTo,
                },
              ],
            }
          : {},
      },
    }),
  ];

  await prisma.$transaction(queries);

  return redirect("/admin/categories");
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
      <h1>Edit Category</h1>
      <div>
        <label>
          <span>Name</span>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. Shipped"
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
        <label>
          <span>Slug</span>
          <input
            type="text"
            name="slug"
            required
            placeholder="e.g. shipped"
            aria-invalid={errors?.slug ? true : undefined}
            aria-errormessage={errors?.slug ? "slug-error" : undefined}
          />
        </label>
        {errors?.slug && (
          <div className="pt-1 text-red-700" id="slug-error">
            {errors.slug}
          </div>
        )}
      </div>
      <div>
        <label>
          <span>Color</span>
          <input
            type="text"
            name="colorHex"
            required
            placeholder="e.g. #000000"
            defaultValue="#000000"
            aria-invalid={errors?.colorHex ? true : undefined}
            aria-errormessage={errors?.colorHex ? "colorHex-error" : undefined}
          />
        </label>
        {errors?.colorHex && (
          <div className="pt-1 text-red-700" id="colorHex-error">
            {errors.colorHex}
          </div>
        )}
      </div>

      <div>
        <label>
          <input type="checkbox" name="restricted" />
          Restrict posting to this category
        </label>
      </div>

      <h2>Post Notifications</h2>

      <div>
        <label>
          <span>Slack Webhook URL</span>
          <input
            type="text"
            name="slack.webhookUrl"
            placeholder="e.g. https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
            aria-invalid={errors?.slackConfig?.webhookUrl ? true : undefined}
            aria-errormessage={
              errors?.slackConfig?.webhookUrl
                ? "slack-webhook-url-error"
                : undefined
            }
          />
        </label>
        {errors?.slackConfig?.webhookUrl && (
          <div className="pt-1 text-red-700" id="slack-webhook-url-error">
            {errors.slackConfig?.webhookUrl}
          </div>
        )}
      </div>

      <div>
        <label>
          <span>Email</span>
          <input
            type="text"
            name="email.to"
            placeholder="e.g. my-notifications@example.company"
            aria-invalid={errors?.emailConfig?.to ? true : undefined}
            aria-errormessage={
              errors?.emailConfig?.to ? "email-to-error" : undefined
            }
          />
        </label>
        {errors?.emailConfig?.to && (
          <div className="pt-1 text-red-700" id="email-to-error">
            {errors.emailConfig?.to}
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