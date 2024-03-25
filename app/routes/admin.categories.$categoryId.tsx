import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import type { ComponentPropsWithoutRef } from "react";

import { requireAdmin } from "~/services/auth.server";
import { getCategory } from "~/models/category.server";
import { prisma } from "~/services/db.server";
import FormActions from "~/components/form-actions";
import ButtonGroup from "~/components/button-group";
import Button from "~/components/button";
import { createRef, useState } from "react";
import HelpText from "~/components/help-text";
import { isEmoji } from "~/lib/emoji";
import EmojiPicker from "~/components/emoji-picker";
import { EmojiButton } from "~/components/emoji-reaction";

const DEFAULT_EMOJIS = ["❤️"];

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  await requireAdmin(request, context);
  invariant(params.categoryId, "categoryId not found");
  const category = await prisma.category.findFirst({
    where: { id: params.categoryId },
    include: {
      slackConfig: true,
      emailConfig: true,
      metaConfig: true,
    },
  });
  invariant(category, "invalid category");

  return json({ category });
}

export async function action({ request, context, params }: ActionFunctionArgs) {
  await requireAdmin(request, context);
  invariant(params.categoryId, "categoryId not found");
  const { categoryId } = params;
  const category = await getCategory({ id: categoryId });
  if (!category) throw new Response("Not Found", { status: 404 });

  const formData = await request.formData();
  const name = formData.get("name");
  const slug = formData.get("slug");
  const description = formData.get("description");
  const colorHex = formData.get("colorHex");
  const restricted = !!formData.get("restricted");
  const allowComments = !!formData.get("allowComments");
  const defaultEmojis = formData.getAll("defaultEmojis");
  const deleted = !!formData.get("deleted");
  const slackWebhookUrl = formData.get("slack.webhookUrl");
  const emailTo = formData.get("email.to");
  const emailSubjectPrefix = formData.get("email.subjectPrefix");

  let meta: {
    name: string;
    id?: any;
    description: string;
    required: boolean;
  }[] = [];
  formData.forEach((value, key) => {
    let match = key.match(/^meta\[(\d+)?]\.(.+)$/i);
    if (match) {
      const idx: number = match[1] ? parseInt(match[1]) + 1 : 0;
      while (meta.length <= idx) {
        meta.push({ id: null, name: "", description: "", required: false });
      }
      meta[idx][match[2]] = match[2] === "required" ? !!value : value;
    }
  });

  meta = meta.filter(({ name }) => !!name);
  const existingMetaIds = meta.map(({ id }) => id).filter((id) => !!id);

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
    prisma.category.update({
      where: { id: categoryId },
      data: {
        name,
        slug,
        description,
        colorHex,
        restricted,
        deleted,
        allowComments,
        defaultEmojis,
      },
    }),
    prisma.categorySlack.deleteMany({
      where: { categoryId },
    }),
    prisma.categoryEmail.deleteMany({
      where: { categoryId },
    }),
  ];

  if (existingMetaIds) {
    queries.push(
      prisma.categoryMeta.deleteMany({
        where: {
          categoryId,
          NOT: {
            id: {
              in: existingMetaIds,
            },
          },
        },
      }),
    );
  }

  if (slackWebhookUrl) {
    queries.push(
      prisma.categorySlack.create({
        data: {
          categoryId,
          webhookUrl: slackWebhookUrl,
        },
      }),
    );
  }

  if (emailTo) {
    queries.push(
      prisma.categoryEmail.create({
        data: {
          categoryId,
          to: emailTo,
          subjectPrefix: emailSubjectPrefix || null,
        },
      }),
    );
  }

  meta.forEach(({ id, ...data }) => {
    if (id) {
      // TODO(dcramer): we'd like to also pass in categoryId to the WHERE, but Prisma currently
      // forbids updates with multiple conditions
      queries.push(
        prisma.categoryMeta.update({
          where: { id },
          data,
        }),
      );
    } else {
      queries.push(
        prisma.categoryMeta.create({
          data: {
            ...data,
            categoryId,
          },
        }),
      );
    }
  });

  await prisma.$transaction(queries);

  return redirect("/admin/categories");
}

function MetaContainer(props: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className="border border-border-light dark:border-border-dark p-4 mb-6"
      {...props}
    />
  );
}

export default function Index() {
  const { category } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const errors = actionData?.errors;

  const [currentEmojiList, setCurrentEmojiList] = useState(
    category.defaultEmojis || DEFAULT_EMOJIS,
  );

  const slackConfig = category.slackConfig.find(() => true);
  const emailConfig = category.emailConfig.find(() => true);

  const [metaConfig, setMetaConfig] = useState(category.metaConfig);

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
        <label className="field-required">
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
        <label className="field-required">
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
          <span>Description</span>
          <input
            type="text"
            name="description"
            placeholder="e.g. Clever and quirky updates about things we've delivered."
            autoFocus
            defaultValue={category.description || ""}
            aria-invalid={errors?.description ? true : undefined}
            aria-errormessage={
              errors?.description ? "description-error" : undefined
            }
          />
        </label>
        {errors?.description && (
          <div className="pt-1 text-red-700" id="description-error">
            {errors.description}
          </div>
        )}
      </div>
      <div>
        <label className="field-required">
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
        <label className="field-inline">
          <input
            type="checkbox"
            name="restricted"
            defaultChecked={category.restricted}
          />
          Restrict posting to this category
        </label>
      </div>

      <div>
        <label className="field-inline">
          <input
            type="checkbox"
            name="allowComments"
            defaultChecked={category.allowComments}
          />
          Allow comments on posts in this category
        </label>
      </div>

      <div style={{ marginBottom: 20 }}>
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
        <label>
          <span>Subject Prefix</span>
          <input
            type="text"
            name="email.subjectPrefix"
            placeholder="e.g. [shipped]"
            defaultValue={emailConfig?.subjectPrefix || ""}
            aria-invalid={errors?.emailConfig?.subjectPrefix ? true : undefined}
            aria-errormessage={
              errors?.emailConfig?.subjectPrefix
                ? "email-subject-prefix-error"
                : undefined
            }
          />
        </label>
        {errors?.emailConfig?.subjectPrefix && (
          <div className="pt-1 text-red-700" id="email-subject-prefix-error">
            {errors.emailConfig?.subjectPrefix}
          </div>
        )}
      </div>

      <h2>Metadata</h2>
      <p>
        Define additional content fields to associate with posts. This is useful
        for things like e.g. a fixed location for a video URL.
      </p>

      <div>
        {metaConfig.map((meta, idx) => (
          <MetaContainer key={meta.id || idx}>
            <input
              type="hidden"
              name={`meta[${idx}].id`}
              value={meta.id || ""}
            />
            <label className="field-required">
              <span>Name</span>
              <input
                type="text"
                name={`meta[${idx}].name`}
                placeholder="e.g. Video URL"
                defaultValue={meta.name}
              />
            </label>

            <label>
              <span>Description</span>
              <input
                type="text"
                name={`meta[${idx}].description`}
                placeholder="e.g. The URL to the public YouTube video for this post."
                defaultValue={meta.description}
              />
            </label>

            <div>
              <label className="field-inline">
                <input
                  type="checkbox"
                  name={`meta[${idx}].required`}
                  defaultChecked={meta.required}
                />
                Require this information on new posts?
              </label>
            </div>

            <ButtonGroup>
              <Button
                mode="danger"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  setMetaConfig(metaConfig.filter((_, mcIdx) => idx !== mcIdx));
                }}
              >
                Remove
              </Button>
            </ButtonGroup>
          </MetaContainer>
        ))}

        <NewMetaConfig
          onCreate={(newMetaConfig) => {
            setMetaConfig([...metaConfig, newMetaConfig]);
          }}
        />
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

const NewMetaConfig = ({ onCreate }) => {
  const nameRef = createRef<HTMLInputElement>();
  const descRef = createRef<HTMLInputElement>();

  return (
    <MetaContainer>
      <input type="hidden" name="meta[].id" value="" />
      <label className="field-required">
        <span>Name</span>
        <input
          type="text"
          name="meta[].name"
          placeholder="e.g. Video URL"
          ref={nameRef}
        />
      </label>

      <label>
        <span>Description</span>
        <input
          type="text"
          name="meta[].description"
          placeholder="e.g. The URL to the public YouTube video for this post."
          ref={descRef}
        />
      </label>

      <div>
        <label className="field-inline">
          <input type="checkbox" name="meta[].required" />
          Require this information on new posts?
        </label>
      </div>

      <ButtonGroup>
        <Button
          mode="primary"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            onCreate({
              name: nameRef.current!.value,
              description: descRef.current!.value,
            });
            nameRef.current!.value = "";
            descRef.current!.value = "";
          }}
        >
          Add Another
        </Button>
      </ButtonGroup>
    </MetaContainer>
  );
};
