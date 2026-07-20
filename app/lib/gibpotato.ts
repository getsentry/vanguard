import { error } from "./logging";

const GIBPOTATO_USERS_URL = "https://gibpotato.app/api/users";

type GibPotatoUser = {
  slack_user_id: string;
  slack_email: string;
};

/**
 * Resolves a Vanguard user's email address to their Slack user ID via the
 * GibPotato API (`GET /api/users`, Bearer-token auth). Used to render the
 * post author as a real Slack @mention in notifications — which is also what
 * lets GibPotato award potatoes to the author when people react to the
 * message.
 *
 * Fails soft by design: a missing `GIBPOTATO_API_KEY`, a non-200 response,
 * a network error, or an unmatched email all return `null`. A Slack
 * notification must never be dropped because GibPotato is unavailable.
 */
export async function getSlackUserId(email: string): Promise<string | null> {
  const apiKey = process.env.GIBPOTATO_API_KEY;
  if (!apiKey) {
    console.log("[gibpotato] GIBPOTATO_API_KEY not set — skipping Slack ID lookup");
    return null;
  }

  try {
    const res = await fetch(GIBPOTATO_USERS_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      console.error(`[gibpotato] users request failed — status=${res.status}`);
      error("gibpotato users request failed", {
        context: {},
        tags: { statusCode: res.status },
      });
      return null;
    }

    const users = (await res.json()) as GibPotatoUser[];
    const needle = email.toLowerCase();
    const match = users.find((u) => u.slack_email?.toLowerCase() === needle);

    if (!match) {
      console.log(`[gibpotato] no user matched email=${email}`);
      return null;
    }

    return match.slack_user_id;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[gibpotato] users request threw — ${message}`);
    error(err instanceof Error ? err : new Error(message), {
      context: { source: "gibpotato.getSlackUserId" },
      tags: {},
    });
    return null;
  }
}
