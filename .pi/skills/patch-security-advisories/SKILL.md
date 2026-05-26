---
name: patch-security-advisories
description: Patches open Dependabot security advisories in this repo (vanguard) by carefully bumping transitive dependencies through pnpm.overrides and pinning every version in package.json. Use when asked to "patch security advisories", "bump security deps", "look at open security PRs", "fix dependabot alerts", "review security advisories", or "pin down versions". Knows the vanguard-specific gotchas — scoped overrides for major-jump packages, why Dependabot's auto-PRs keep failing on this repo, and how to verify with the local docker postgres.
---

# Patch open Dependabot security advisories on vanguard

Use this playbook when the user asks to address open security advisories or unpin/pin dependencies on `getsentry/vanguard`. The flow has been validated end-to-end on this repo and bakes in the gotchas that broke previous Dependabot PRs.

## Step 0: Inventory before touching anything

**Always present a written list and get explicit confirmation before changing files.** The user expects to see scope before any commit happens.

```bash
# 1. Open Dependabot alerts (the source of truth for "what's vulnerable")
gh api /repos/getsentry/vanguard/dependabot/alerts --paginate \
  -q '.[] | select(.state == "open") | {
    number, severity: .security_advisory.severity,
    package: .dependency.package.name,
    summary: .security_advisory.summary,
    ghsa: .security_advisory.ghsa_id,
    vulnerable_range: .security_vulnerability.vulnerable_version_range,
    patched: .security_vulnerability.first_patched_version.identifier
  }'

# 2. Open PRs that may already address them
gh pr list --state open --limit 50 \
  --json number,title,headRefName,statusCheckRollup,mergeable

# 3. For each vulnerable package, find who pulls it in
pnpm why <package>
```

For each vulnerable package, classify:

- **Direct dep** (listed in `package.json`) → bump in `package.json`.
- **Transitive dep** (only in lockfile) → fix via `pnpm.overrides`. Vanguard's advisories are almost always transitive.

## Step 1: Confirm scope with the user

Report back with:

- Table of open advisories: package, current, patched, parent (from `pnpm why`), existing PR (if any).
- List of open PRs touching deps with current CI status.
- Count of unpinned versions in `package.json` (`grep -cE '"\^|"~' package.json`).
- Proposed plan (single PR with all fixes + pinning) + risks (major-jump overrides like `uuid` v8 → v11).

**Do not proceed without a "go".**

## Step 2: Branch + edit package.json

```bash
git checkout -b chore/security-pin-deps
```

### Pin every direct dependency

Strip every `^` and `~` from `dependencies`, `devDependencies`, and `pnpm.overrides`. Pin to the version **currently installed** (from `pnpm-lock.yaml`), not to `latest`.

Get the installed versions in one shot:

```bash
pnpm list --depth 0 --json | jq -r '.[0]
  | (.dependencies // {}), (.devDependencies // {})
  | to_entries[] | "\(.key)\t\(.value.version)"' | sort
```

Use the resulting versions verbatim. Common discrepancies: `@types/node` resolves higher than declared, so pin to the actual resolved version.

### Add pnpm.overrides for each transitive advisory

In `package.json`, under `pnpm.overrides`, add an entry for each vulnerable transitive dep, set to the patched version.

```jsonc
"pnpm": {
  "overrides": {
    "form-data": "4.0.4",
    "axios": "1.15.0",
    "rollup": "4.60.2",
    "qs": "6.15.2",
    "ws": "8.20.1",
    "uuid": "11.1.1",
    "brace-expansion@5": "5.0.6"   // scoped — see gotcha below
  }
}
```

### 🚨 Gotcha: scope range-restricted overrides

A global override **forces every transitive instance** to that version. If the package has multiple major lines in the tree and older majors are still in active use by other deps, a global pin will break them.

**Concrete example from this repo:** A global `"brace-expansion": "5.0.6"` override breaks `minimatch@9`, because `minimatch@9` calls `brace_expansion.default()` — a default export that v5 removed. This is the exact reason Dependabot PRs for `brace-expansion` keep failing CI on this repo.

**Rule:** if the vulnerability range is scoped to one major line (e.g. `>= 5.0.0, < 5.0.6`), scope the override too:

```jsonc
"brace-expansion@5": "5.0.6"   // only affects v5 consumers
```

pnpm supports the `<name>@<major>` syntax in `overrides` keys.

**When to apply scoping (decision table):**

| Situation                                                    | Override syntax                                |
| ------------------------------------------------------------ | ---------------------------------------------- |
| Vuln spans the entire installed range, no API breakage       | `"pkg": "x.y.z"` (global)                      |
| Vuln is in one major line only, older majors coexist in tree | `"pkg@<major>": "x.y.z"` (scoped)              |
| Patched version drops APIs older deps still use              | scoped override + verify with `pnpm typecheck` |

### 🚨 Gotcha: major-jump overrides

When the patched version crosses a major (e.g. `uuid` 8.3.2 → 11.1.1), verify the upgrade is API-compatible with the actual consumer:

```bash
find node_modules/.pnpm/<consumer>* -name "*.js" | xargs grep -l "<package>" | head -5
grep -n "<package>" <file>   # inspect actual usage
```

For `uuid` on vanguard, the only runtime caller is `remix-auth-oauth2` using `uuid.v4()`, which is API-stable across v8/v9/v11. Safe.

## Step 3: Install + verify lockfile

```bash
pnpm install
```

Confirm patched versions are in place and old ones are gone:

```bash
for pkg in <vuln-package-1> <vuln-package-2>; do
  echo "=== $pkg ==="
  grep -E "^\s+${pkg}@" pnpm-lock.yaml | sort -u
done
```

If a vulnerable version still appears: your override is wrong (probably needs scoping, or a different parent dep is requesting an explicit different version).

## Step 4: Run the full verification suite

```bash
# Local Postgres is required for tests
docker-compose up -d

pnpm typecheck      # tsc -b after react-router typegen
pnpm test           # migrates test DB + runs Vitest (163 tests expected to pass)
pnpm build          # react-router build
pnpm exec vp check  # oxlint + oxfmt
```

**Vanguard-specific notes:**

- `pnpm test` requires the local postgres container; start it with `docker-compose up -d` first.
- `vp check` will flag any unrelated unstaged files in the working tree (e.g. a stray `index.html` at the repo root). Inspect what it flagged — if it's not in your diff, it's not your problem.
- A `typecheck` failure mentioning `brace_expansion_1.default is not a function` means you have the unscoped `brace-expansion` override — switch to `brace-expansion@5`.

## Step 5: Close superseded PRs + commit + PR

If existing Dependabot PRs (e.g. lockfile-only bumps of `ws`, `brace-expansion`) are now redundant:

```bash
gh pr close <PR-number> --comment "Superseded by #<our-PR>, which applies the fix via pnpm.overrides alongside the other open advisories."
```

Commit with the `commit` skill — single subject under 72 chars, body that lists each advisory with its GHSA ID, notes any scoped overrides, and lists what was verified.

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): patch <N> medium-severity advisories and pin versions" \
  -m "<detailed body>"
git push -u origin chore/security-pin-deps

gh pr create --base main --title "<same subject>" --body "<body with advisory table + verification + supersedes list>"
```

## Output checklist

Before declaring done, confirm:

- [ ] Every open Dependabot alert in the report has a corresponding override or direct bump.
- [ ] No `^` or `~` remains in `package.json` (`grep -E '"\^|"~' package.json` returns nothing).
- [ ] `pnpm typecheck` exits 0.
- [ ] `pnpm test` shows all tests passing.
- [ ] `pnpm build` exits 0.
- [ ] `vp check` flags only files unrelated to the diff.
- [ ] Lockfile no longer contains the vulnerable versions.
- [ ] Superseded Dependabot PRs are closed with a comment.
- [ ] Commit body lists every GHSA ID patched.

## Reference: vanguard's tech context

- **Package manager:** pnpm 10.x (enforced via `preinstall` hook).
- **Lockfile:** `pnpm-lock.yaml` (committed). Always update via `pnpm install`, never edit by hand.
- **Test DB:** local Postgres at `localhost:5432` via `docker-compose.yml`.
- **CI:** `.github/workflows/ci.yml` runs `vp check`, `typecheck`, and Vitest with a service-container postgres.
- **Dependabot config:** `.github/dependabot.yml` (groups not configured — alerts arrive one PR at a time, which is why bundling them ourselves is the right move).
