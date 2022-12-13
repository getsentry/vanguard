import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import { requireAdmin } from "~/services/auth.server";
import type { Feed } from "~/models/feed.server";
import { getFeed } from "~/models/feed.server";
import { prisma } from "~/services/db.server";
import FormActions from "~/components/form-actions";
import ButtonGroup from "~/components/button-group";
import Button from "~/components/button";
import { buildUrl } from "~/lib/http";

type LoaderData = {
  feed: Feed;
  feedUrl: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  await requireAdmin(request);
  invariant(params.feedId, "feedId not found");
  const { feedId } = params;
  const feed = await getFeed({ id: feedId });
  if (!feed) throw new Response("Not Found", { status: 404 });

  const feedUrl = buildUrl(`/feeds/${feed.id}.xml`, request);

  return json<LoaderData>({ feed, feedUrl });
};

type ActionData = {
  errors?: {
    name?: string;
    url?: string;
    webhookUrl?: string;
  };
};

export const action: ActionFunction = async ({ request, params }) => {
  await requireAdmin(request);
  invariant(params.feedId, "feedId not found");
  const { feedId } = params;
  const feed = await getFeed({ id: feedId });
  if (!feed) throw new Response("Not Found", { status: 404 });

  const formData = await request.formData();
  const name = formData.get("name");
  const url = formData.get("url");
  const webhookUrl = formData.get("webhookUrl");
  const restricted = !!formData.get("restricted");
  const deleted = !!formData.get("deleted");

  if (typeof name !== "string" || name.length === 0) {
    return json<ActionData>(
      { errors: { title: "Name is required" } },
      { status: 400 }
    );
  }

  const queries: any[] = [
    prisma.feed.update({
      where: { id: feedId },
      data: {
        name,
        url,
        restricted,
        deleted,
        webhookUrl,
      },
    }),
  ];

  await prisma.$transaction(queries);

  return redirect("/admin/feeds");
};

export default function Details() {
  const { feed, feedUrl } = useLoaderData() as LoaderData;
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
      <h1>Edit Feed</h1>

      <div>
        <label className="field-required">
          <span>URL</span>
          <a href={feedUrl}>{feedUrl}</a>
        </label>
      </div>

      <div>
        <label className="field-required">
          <span>Name</span>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. blog.sentry.io"
            autoFocus
            defaultValue={feed.name || ""}
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
            defaultValue={feed.webhookUrl || ""}
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
          <input
            type="checkbox"
            name="restricted"
            defaultChecked={feed.restricted}
          />
          Restrict syndication to this feed
        </label>
      </div>

      <FormActions>
        <ButtonGroup>
          <Button type="submit" mode="primary">
            Save Changes
          </Button>
          <Button type="submit" name="deleted" value="true" mode="danger">
            Delete
          </Button>
        </ButtonGroup>
      </FormActions>
    </Form>
  );
}
