import { error } from "./logging";

const GIBPOTATO_USERS_URL = "https://gibpotato.app/api/users";

/**
 * Reduces an email to `<first dot-segment of local part>@<domain>` so that
 * "chris.jannings@sentry.io" and "chris@sentry.io" produce the same key.
 */
function firstNameKey(email: string): string {
  const [local, domain] = email.split("@");
  return `${local.split(".")[0]}@${domain}`;
}

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
 * Matching is exact first, then falls back to a fuzzy first-name match:
 * some people's Slack email only uses their first name (chris@sentry.io)
 * while Vanguard has the full form (chris.jannings@sentry.io) — or vice
 * versa. The fuzzy pass compares the first dot-segment of the local part
 * plus the domain, and only accepts a single unambiguous candidate (two
 * "chris"es → no match, never mention the wrong person).
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
    const exact = users.find((u) => u.slack_email?.toLowerCase() === needle);
    if (exact) return exact.slack_user_id;

    const needleKey = firstNameKey(needle);
    const fuzzy = users.filter(
      (u) => u.slack_email && firstNameKey(u.slack_email.toLowerCase()) === needleKey,
    );
    if (fuzzy.length === 1) {
      console.log(
        `[gibpotato] fuzzy first-name match — email=${email} slack_email=${fuzzy[0].slack_email}`,
      );
      return fuzzy[0].slack_user_id;
    }

    console.log(
      `[gibpotato] no user matched email=${email}${fuzzy.length > 1 ? ` (fuzzy match ambiguous — ${fuzzy.length} candidates)` : ""}`,
    );
    return null;
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
