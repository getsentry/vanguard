import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { requireAdmin } from "~/session.server";
import type { Category } from "~/models/category.server";
import { getCategory } from "~/models/category.server";
import { prisma } from "~/db.server";

type LoaderData = {
  category: Category;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  await requireAdmin(request);
  invariant(params.categoryId, "categoryId not found");
  const category = await prisma.category.findFirst({
    where: { id: params.categoryId },
    include: {
      slackConfig: true,
      emailConfig: true,
    },
  });
  invariant(category, "invalid category");

  return json<LoaderData>({ category });
};

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
  invariant(params.categoryId, "categoryId not found");
  const { categoryId } = params;
  const category = await getCategory({ id: categoryId });
  invariant(category, "invalid category");

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
    prisma.category.update({
      where: { id: categoryId },
      data: {
        name,
        slug,
        colorHex,
        restricted,
      },
    }),
    prisma.categorySlack.deleteMany({
      where: { categoryId },
    }),
    prisma.categoryEmail.deleteMany({
      where: { categoryId },
    }),
  ];

  if (slackWebhookUrl) {
    queries.push(
      prisma.categorySlack.create({
        data: {
          categoryId,
          webhookUrl: slackWebhookUrl,
        },
      })
    );
  }

  if (emailTo) {
    queries.push(
      prisma.categoryEmail.create({
        data: {
          categoryId,
          to: emailTo,
        },
      })
    );
  }

  await prisma.$transaction(queries);

  return redirect("/admin/categories");
};

export default function Index() {
  const { category } = useLoaderData() as LoaderData;
  const actionData = useActionData() as ActionData;
  const errors = actionData?.errors;

  const slackConfig = category.slackConfig.find(() => true);
  const emailConfig = category.emailConfig.find(() => true);

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
            defaultValue={category.name || ""}
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
            defaultValue={category.slug || ""}
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
            defaultValue={category.colorHex || "#000000"}
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
          <input
            type="checkbox"
            name="restricted"
            defaultChecked={category.restricted}
          />
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
            defaultValue={slackConfig?.webhookUrl || ""}
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
            defaultValue={emailConfig?.to || ""}
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
