import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";

import { requireAdmin } from "~/services/auth.server";
import { prisma } from "~/services/db.server";
import FormActions from "~/components/form-actions";
import Button from "~/components/button";
import { useState } from "react";
import { EmojiButton } from "~/components/emoji-reaction";
import EmojiPicker from "~/components/emoji-picker";
import HelpText from "~/components/help-text";
import { isEmoji } from "~/lib/emoji";

const DEFAULT_EMOJIS = ["❤️"];

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireAdmin(request, context);

  return null;
}

export async function action({ request, context }: ActionFunctionArgs) {
  await requireAdmin(request, context);
  const formData = await request.formData();
  const name = formData.get("name");
  const slug = formData.get("slug");
  const colorHex = formData.get("colorHex");
  const restricted = !!formData.get("restricted");
  const allowComments = !!formData.get("allowComments");
  const defaultEmojis = formData.getAll("defaultEmojis");
  const slackWebhookUrl = formData.get("slack.webhookUrl");
  const emailTo = formData.get("email.to");

  if (typeof name !== "string" || name.length === 0) {
    return json({ errors: { name: "Name is required" } }, { status: 400 });
  }

  if (typeof slug !== "string" || slug.length === 0) {
    return json({ errors: { slug: "Slug is required" } }, { status: 400 });
  }

  // TODO: validate
  if (typeof colorHex !== "string" || colorHex.length === 0) {
    return json({ errors: { colorHex: "Color is required" } }, { status: 400 });
  }

  if (defaultEmojis.find((v) => !isEmoji(v))) {
    return json(
      {
        errors: {
          defaultEmojis:
            "An invalid reaction was provided. All values must be emoji",
        },
      },
      { status: 400 },
    );
  }

  const queries: any[] = [
    prisma.category.create({
      data: {
        name,
        slug,
        colorHex,
        restricted,
        allowComments,
        defaultEmojis,
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
}

export default function Index() {
  const actionData = useActionData<typeof action>();
  const errors = actionData?.errors;
  const [currentEmojiList, setCurrentEmojiList] = useState(DEFAULT_EMOJIS);

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
      <h1>Create Category</h1>
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
        <label className="field-inline">
          <input type="checkbox" name="restricted" />
          Restrict posting to this category
        </label>
      </div>

      <div>
        <label className="field-inline">
          <input type="checkbox" name="allowComments" defaultChecked />
          Allow comments on posts in this category
        </label>
      </div>

      <div>
        <label style={{ marginBottom: 10 }}>
          <span style={{ marginBottom: 0 }}>Default Reactions</span>
          <HelpText>A default list of emojis to show for reactions.</HelpText>
        </label>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "5px",
            marginBottom: 10,
          }}
        >
          {currentEmojiList.map((emoji) => {
            return (
              <EmojiButton
                key={emoji}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentEmojiList(
                    currentEmojiList.filter((v) => v !== emoji),
                  );
                }}
              >
                <input type="hidden" name="defaultEmojis" value={emoji} />
                {emoji}
              </EmojiButton>
            );
          })}
        </div>
        <EmojiPicker
          onEmojiSelect={(e, emoji) => {
            setCurrentEmojiList([...currentEmojiList, emoji]);
          }}
        />
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
      <FormActions>
        <Button type="submit" mode="primary">
          Save Changes
        </Button>
      </FormActions>
    </Form>
  );
}
