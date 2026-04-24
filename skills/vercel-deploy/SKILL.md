---
name: vercel-deploy
description: Deploy Vanguard to Vercel and debug preview/production failures. Use when asked to "deploy to vercel", "vercel preview", "vercel is broken", "vercel is stuck", "debug vercel", "vercel logs", "env var missing on vercel", "vercel 500", or when a Vercel deployment crashes, hangs, or misbehaves. Covers first-deploy setup, the `vercel build && vercel deploy --prebuilt` iteration loop, env var scoping, module-load crashes, native-module ELF errors, SSO gate recognition, and live log tailing.
---

Deploy and debug Vanguard on Vercel using the fastest feedback loop available: local `vercel build`, prebuilt upload, live log tail.

## Mental model

Internalise these before touching anything on Vercel.

### Build time ≠ runtime

| Phase | What runs | Env vars read | Native deps |
|---|---|---|---|
| **Build** (`vercel build`) | `react-router build`, esbuild, Vite plugins, Sentry sourcemap upload | Only vars the build itself needs (e.g. `SENTRY_AUTH_TOKEN`) | Runs on the local machine's platform (e.g. arm64 macOS) |
| **Runtime** (Lambda cold start) | `build/server/nodejs_<b64>/index.js` top-level code → request handlers | All `process.env.*` reads, including top-level `invariant(process.env.X)` guards | Runs on Vercel's Linux x64 (or arm64) — binaries must match |

Any error about `process.env.X` not being set is a **runtime** problem, not a build problem.

### Env var scopes are three independent silos

Vercel splits env vars across **Production**, **Preview**, **Development**. A var set only in one scope is **invisible** to the others. Feature branches → Preview scope. `main` → Production scope. `vercel dev` → Development scope.

`vercel env ls` shows which scopes each var is registered in. If a Preview Lambda can't see a var, the var is likely scoped to Production only, or stored with an empty value.

### `--prebuilt` ships local binaries

`vercel deploy --prebuilt` uploads `.vercel/output/` as-is. Any native `.node` binary in there was compiled for your local arch. On Vercel's Linux runtime, loading a Mach-O binary fails with `invalid ELF header`. Avoid native deps entirely — prefer pure-JS alternatives (`bcryptjs`, not `bcrypt`).

## Step 1: Prerequisites (one-time)

Before the first deploy, confirm:

```bash
# Vercel CLI installed and logged in
vercel --version                        # expect >= 40
vercel whoami

# Project linked (creates .vercel/project.json, gitignored)
vercel link                             # pick team=sentry, project=vanguard

# @vercel/react-router preset wired in react-router.config.ts
grep -q "vercelPreset" react-router.config.ts && echo "OK" || echo "MISSING — this MUST be added or the build output is not Vercel-shaped"
```

Required `react-router.config.ts`:

```ts
import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

export default {
  ssr: true,
  presets: [vercelPreset()],
} satisfies Config;
```

Without the preset, `react-router build` emits a generic Node bundle, not the `build/server/nodejs_<b64>/` layout Vercel needs. The `<b64>` segment is base64url-encoded `{"runtime":"nodejs"}` — seeing it means the preset is active.

## Step 2: The deploy + debug loop

Use this sequence for every deploy. It's faster than pushing to GitHub and gives local build logs:

```bash
vercel build                            # builds into .vercel/output/, streams logs locally
vercel deploy --prebuilt                # uploads only .vercel/output/, ~5–30s to Ready
```

Do NOT use plain `vercel` without `--prebuilt` for iteration. It uploads the whole repo context (several MB incl. `.git`), runs the build remotely, and silently stalls the progress bar while waiting — looks identical to a hang.

Expected output:

```
Inspect: https://vercel.com/sentry/vanguard/<deployment-id>
Preview: https://vanguard-<hash>.sentry.dev [~30s]
```

The "Upload 100% then nothing happens for 20s" phase is **normal** — the CLI is waiting on the build queue. Don't Ctrl+C; it's working.

## Step 3: Tail logs

```bash
vercel logs https://vanguard-<hash>.sentry.dev
```

- Pass the **specific deployment URL** to scope the tail to one deployment. Without a URL argument, `vercel logs` targets production.
- The tail auto-kills after 5 minutes of idle. Re-run if it exits.
- Logs only appear when the Lambda actually runs — if requests are blocked at the SSO gate (see Step 5), the function never fires and no logs appear.

Lines starting with `ℹ️` are successful invocations. `🚫` is a crash. Look for:

```
17:41:11  🚫  GET  ---  vanguard-xyz.sentry.dev  ƒ  /
Error: ...
    at file:///var/task/build/server/nodejs_<b64>/index.js:<line>:<col>
```

## Step 4: Common runtime errors

### `SyntaxError: Cannot use import statement outside a module`

The server bundle uses `import`/`export` but no ancestor `package.json` declares `"type": "module"`. The `@vercel/react-router` preset does **not** emit a nested `package.json` — it must be at the repo root.

Fix:

```json
// package.json
{
  "type": "module"
}
```

Any `.js` file that still uses `module.exports` / `require()` must be renamed to `.cjs` (e.g. `tailwind.config.cjs`, `postcss.config.cjs`).

### `invalid ELF header` / `ERR_DLOPEN_FAILED`

A native `.node` binary compiled for the local arch got shipped via `--prebuilt` to Vercel's Linux runtime. Identify the culprit from the path in the error:

```
/var/task/node_modules/.pnpm/<package>@<ver>/.../binding/.../xyz.node: invalid ELF header
```

Swap for a pure-JS alternative. Known cases for Vanguard:

| Native | Pure-JS drop-in | Notes |
|---|---|---|
| `bcrypt` | `bcryptjs` | Same `hashSync`/`compareSync` API, wire-format compatible (`$2b$` hashes are portable) |
| `sharp` (if ever added) | `@vercel/og` or client-side | Only if image processing is actually needed |

After swapping, remove any `optimizeDeps.exclude` / `ssr.external` entries for the old native package from `vite.config.ts` and drop it from `pnpm.onlyBuiltDependencies` in `package.json`.

### `Error: Invariant failed` at module load

`tiny-invariant` fires in a top-level `invariant(process.env.X, ...)` guard. In production builds, `tiny-invariant` strips the message — you get `"Invariant failed"` with no context.

Currently the only top-level invariant in the repo is:

```ts
// app/services/session.server.ts
invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");
```

Check with:

```bash
rg "^invariant\(process\.env" app/
```

Fix: set the missing var in Vercel, scoped to the failing environment, **then redeploy** (env changes don't retroactively apply to existing Lambdas).

### Silent 500 on first request with no stack

The code reads an env var without guarding it, gets `undefined`, then fails later — often inside `pg`, `drizzle`, or a third-party client with an unhelpful error. Add a one-shot diagnostic (Step 6) to identify which var is missing.

## Step 5: Recognising the SSO gate

Vanguard's Vercel project has **Deployment Protection** enabled — all preview URLs require a Vercel login. Requests hitting the gate return:

```
HTTP/2 401
server: Vercel
set-cookie: _vercel_sso_nonce=...
```

This is **not** an app error. The Lambda never runs. Give-aways:

- Response is HTML, not JSON
- `server: Vercel` header (our app doesn't set this)
- `_vercel_sso_nonce` cookie is being set
- `vercel logs` shows zero invocations even though you hit the URL

To test the app itself, open the preview URL in a browser where you're logged into the Sentry Vercel team — the SSO redirect completes and subsequent requests carry an auth cookie.

For headless/CI testing, generate a **Protection Bypass for Automation** token in Settings → Deployment Protection, then include it:

```bash
curl -H "x-vercel-protection-bypass: $TOKEN" https://vanguard-xyz.sentry.dev/
```

## Step 6: Diagnostic pattern for env var issues

When you've set a var in Vercel but the Lambda still acts like it's missing, add a temporary diagnostic at the top of `app/services/session.server.ts` (runs at module load):

```ts
// TEMP DIAGNOSTIC — remove after Vercel env debug
console.log("[boot] env diagnostic:", {
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
  SESSION_SECRET_present: Boolean(process.env.SESSION_SECRET),
  SESSION_SECRET_length: process.env.SESSION_SECRET?.length ?? 0,
  DATABASE_URL_present: Boolean(process.env.DATABASE_URL),
  envKeyCount: Object.keys(process.env).length,
});
```

Rebuild + redeploy + tail logs + hit the URL. The boot log prints what the Lambda actually sees. Common findings:

| Symptom | Cause | Fix |
|---|---|---|
| `present: false, length: 0` | Var not in scope OR value is empty string | `vercel env ls` to confirm scope; delete + re-add via dashboard with a real value |
| `present: true, length: 0` | Impossible (length 0 string is falsy — you'd see `false`) | — |
| Var is in `vercel env ls` but Lambda can't see it | Deployment predates the env var — env changes don't retroactively apply | `vercel deploy --prebuilt` again |

Remove the diagnostic immediately after resolving. Don't commit it.

## Step 7: Env var pitfalls

- **`vercel env pull` writes empty strings for `Sensitive` values.** The Lambda still receives real values — but you can't inspect them locally. To verify a sensitive var's real value, use the diagnostic pattern above, or delete and re-add.
- **Env changes require redeploy.** Adding/editing a var only affects future deployments. Existing Lambdas keep the old snapshot until their next cold start against a new deployment.
- **Empty string is falsy in JS but truthy in Vercel's eyes.** An env var set to `""` passes `vercel env ls` but fails `Boolean(process.env.X)`. Treat "set but empty" identical to "not set" — delete and re-add with a real value.
- **Neon integration adds ~20 `PG*`, `POSTGRES_*`, `NEON_*` vars** alongside `DATABASE_URL`. They're harmless; Vanguard only reads `DATABASE_URL`.
- **`USE_BASIC_LOGIN`**: any truthy string activates basic-login mode. `.env.example` uses `1`; `true` also works. Don't use `false` — still truthy as a non-empty string.

## Step 8: First deploy checklist for a fresh Vercel project

In order:

1. Enable the Neon integration (Settings → Storage → Neon) — auto-populates `DATABASE_URL`, `POSTGRES_*`, `PG*` in all three env scopes.
2. Run migrations against the Neon DB from your laptop: `DATABASE_URL=<neon-url> pnpm db:migrate:dev`.
3. Set these in Vercel → Settings → Environment Variables (scoped to **Preview + Production**, or All):
   - `SESSION_SECRET` — `openssl rand -hex 32`
   - `USE_BASIC_LOGIN=1` (simplest path to a working login)
   - `BASE_URL` — leave unset for now; set once you have a stable preview alias
4. Enable Vercel Blob: Settings → Storage → Blob → Create store. Auto-sets `BLOB_READ_WRITE_TOKEN`.
5. Ensure the preset is wired (see Step 1).
6. `vercel build && vercel deploy --prebuilt`.
7. Hit the preview URL in a browser logged into the Vercel team.
8. Tail logs in another terminal: `vercel logs <preview-url>`.
9. Create a user in the Neon DB: `DATABASE_URL=<neon-url> pnpm user create you@sentry.io password123 --admin`.
10. Log in via `/login`. Verify session cookie sticks. Create a post. Upload an image (tests Blob).

If any step fails, consult Step 4. Never advance past a failing step.

## Exit criteria

A deploy is "done" only when:

- [ ] `vercel logs <url>` shows `ℹ️ GET /` invocations, not `🚫`
- [ ] `/login` renders the real Vanguard UI in a browser (not Vercel SSO gate)
- [ ] Log in succeeds — session cookie set, redirect to `/`
- [ ] A known code path that queries Neon returns real data
- [ ] A known code path that writes to Blob succeeds
- [ ] No unexpected `(node:4) Warning:` or uncaught exceptions in logs
- [ ] No diagnostic `console.log`s left in the code — `git diff main..` shows zero temporary instrumentation
