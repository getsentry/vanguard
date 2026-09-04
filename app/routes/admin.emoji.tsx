import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";

import Alert from "~/components/alert";
import Button from "~/components/button";
import HelpText from "~/components/help-text";
import PageHeader from "~/components/page-header";
import { hasSlackEmojiSupport, syncSlackEmojis } from "~/lib/slack-emoji.server";
import { getSlackEmojiStats } from "~/models/emoji.server";
import { requireAdmin } from "~/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);

  const stats = await getSlackEmojiStats();
  return { stats, configured: hasSlackEmojiSupport() };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);

  if (!hasSlackEmojiSupport()) {
    return Response.json({ error: "SLACK_API_TOKEN is not configured." }, { status: 400 });
  }

  try {
    const { total } = await syncSlackEmojis();
    return { total };
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}

export default function AdminEmoji() {
  const { stats, configured } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  const syncing = navigation.state !== "idle";

  return (
    <div>
      <PageHeader title="Slack Emoji" />

      {!configured && (
        <Alert>
          Set <code>SLACK_API_TOKEN</code> to a bot token with the <code>emoji:read</code> scope to
          enable custom emoji.
        </Alert>
      )}
      {result && "error" in result && <Alert>{String(result.error)}</Alert>}
      {result && "total" in result && (
        <p className="mb-4">Synced {result.total.toLocaleString()} emoji from Slack.</p>
      )}

      <p>
        {stats.total.toLocaleString()} emoji mirrored
        {stats.lastSyncedAt ? `, last synced ${new Date(stats.lastSyncedAt).toLocaleString()}` : ""}
        .
      </p>
      <HelpText>
        Vanguard mirrors the workspace's custom emoji so they can be used as reactions and typed as{" "}
        <code>:shortcodes:</code> in posts and comments. Re-sync after someone adds new emoji in
        Slack.
      </HelpText>

      <Form method="post">
        <Button type="submit" mode="primary" disabled={syncing || !configured}>
          {syncing ? "Syncing..." : "Sync from Slack"}
        </Button>
      </Form>
    </div>
  );
}
