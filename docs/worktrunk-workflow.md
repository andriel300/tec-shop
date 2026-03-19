# Git Worktree Workflow with Worktrunk

This project uses [Worktrunk (`wt`)](https://worktrunk.dev) to manage git worktrees. Instead of stashing or context-switching inside a single checkout, each feature branch lives in its own directory. You can switch between branches instantly, run multiple dev servers in parallel, and let `wt merge` enforce lint/typecheck/tests before anything lands on `main`.

## Why worktrees for this project

- 14 services + 3 frontends means a cold build on branch switch is expensive. Worktrees keep each branch's `.next` and Prisma caches independent.
- `pnpm test:affected` during `wt merge` gives local CI guarantees without waiting for remote pipelines.
- You can run a Claude agent on a feature branch in the background while continuing work on another branch.

---

## Step 1 — One-time setup

### Install Worktrunk

```bash
curl -fsSL https://worktrunk.dev/install.sh | sh
```

Then add the shell integration to your `.zshrc` / `.bashrc` (the installer will tell you what to add). Restart your shell.

Verify:

```bash
wt --version
```

### Configure LLM commit message generation (optional but recommended)

Since you already have Claude Code installed, add this to your personal user config:

```bash
wt config create     # if ~/.config/worktrunk/config.toml doesn't exist yet
```

Then open `~/.config/worktrunk/config.toml` and add:

```toml
[commit.generation]
command = "CLAUDECODE= MAX_THINKING_TOKENS=0 claude -p --no-session-persistence --model=haiku --tools='' --disable-slash-commands --setting-sources='' --system-prompt=''"
```

This makes `wt merge` auto-generate a conventional commit message from the diff using Claude Haiku (fast + cheap). `CLAUDECODE=` unsets the nesting guard so it works from inside a Claude Code session.

Verify your config:

```bash
wt config show
```

### Approve project hooks (one-time per developer)

The first time you create a worktree, Worktrunk will ask you to approve the commands in `.config/wt.toml`. You can pre-approve all of them upfront:

```bash
wt hook approvals add
```

---

## Step 2 — Starting a feature branch

```bash
# From anywhere in the repo
wt switch --create feat/user-profile-page
```

What happens automatically:

1. A new worktree is created at `../tec-shop-feat-user-profile-page` (sibling directory)
2. Your shell moves into it
3. **post-create** runs (blocking):
   - `.env` is copied from the primary worktree
   - All Prisma clients are regenerated
4. **post-start** runs in the background:
   - Gitignored cache files are copied from the primary worktree (`.next`, certs, etc.)

You can start coding immediately while the background copy finishes.

### Base off a non-main branch

```bash
wt switch --create fix/order-service-bug --base release/1.2
```

### Useful shortcuts

```bash
wt switch -        # Go back to the previous worktree (like cd -)
wt switch ^        # Go to the main/default branch worktree
wt switch          # Open interactive picker to browse all worktrees
```

---

## Step 3 — Working on the branch

Everything works the same as a normal git checkout. The only difference is the directory location. Your `.env` is already there, and infra (Redis + Kafka) is shared — start it once from any worktree:

```bash
pnpm infra:up
```

Run only the service(s) you're touching:

```bash
# Frontend only
PORT=3000 npx nx dev user-ui

# A single backend service
npx nx serve auth-service

# Everything
pnpm dev
```

---

## Step 4 — Committing

You can commit normally with `git commit`, or use the LLM-powered step command:

```bash
wt step commit    # stages everything + generates commit message via Claude
```

Multiple checkpoints during development are fine — `wt merge` will squash them all into one clean commit.

---

## Step 5 — Merging back to main

When you're done:

```bash
wt merge
```

The full pipeline:

| Step | What runs | Blocking |
|------|-----------|----------|
| Squash | All commits + uncommitted changes → single commit | Yes |
| Commit message | Claude Haiku generates conventional message from diff | Yes |
| Rebase | Rebases onto current `main` | Yes |
| **pre-commit** | `pnpm lint:affected` + `pnpm typecheck:affected` | Yes, fail-fast |
| **pre-merge** | `pnpm test:affected` | Yes, fail-fast |
| Merge | Fast-forward merge into `main` | Yes |
| Cleanup | Worktree + branch removed automatically | — |

If lint, typecheck, or tests fail, the merge aborts. Fix the issue, re-run `wt merge`.

### Merge to a non-main branch

```bash
wt merge staging
wt merge release/1.3
```

### Keep the worktree after merging

```bash
wt merge --no-remove
```

### Skip hooks (emergency only)

```bash
wt merge --no-verify
```

---

## Step 6 — Running hooks manually

Test hooks without creating/merging:

```bash
wt hook pre-merge                  # run all pre-merge hooks
wt hook pre-commit                 # run lint + typecheck
wt hook post-create                # re-run setup (e.g. after schema change)
wt hook post-create --var branch=feat/test  # test with a different branch name
```

---

## Working in parallel (multi-agent pattern)

Worktrunk + Claude Code enables true parallel development. Each agent gets its own isolated worktree:

**If you use tmux:**

```bash
tmux new-session -d -s fix-auth "wt switch --create fix/auth-token-expiry -x claude -- 'JWT tokens expire after 5 minutes instead of 15. Find the expiry config and fix it.'"
```

**If you use Zellij:**

```bash
zellij run -- wt switch --create fix/auth-token-expiry -x claude -- 'JWT tokens expire after 5 minutes instead of 15. Find the expiry config and fix it.'
```

**Or a simple shell alias** (add to `.zshrc`):

```bash
alias wsc='wt switch --create -x claude'

# Usage:
wsc feat/checkout-flow -- 'Implement the checkout flow for the user-ui'
```

Each agent works in its own worktree, runs its own dev server if needed, and merges independently. You review the diff with `wt merge` when it's done.

---

## Listing worktrees

```bash
wt list            # table view: status, commits ahead/behind, age
wt list --full     # includes LLM-generated branch summaries (if configured)
wt switch          # interactive picker with diff preview
```

---

## Project hooks reference

Hooks are defined in `.config/wt.toml` (checked into git). Here is what runs for this project:

| Hook | Commands | When |
|------|----------|------|
| `post-create` | Copy `.env`, `pnpm prisma:generate` | Worktree created (blocking) |
| `post-start` | `wt step copy-ignored` | Worktree created (background) |
| `pre-commit` | `pnpm lint:affected`, `pnpm typecheck:affected` | During `wt merge`, before squash commit |
| `pre-merge` | `pnpm test:affected` | During `wt merge`, after rebase |

All `*:affected` commands use Nx to run only against projects touched by the current branch, keeping CI time proportional to the change size.

---

## Troubleshooting

**`.env` not copied:** The primary worktree (usually `main`) must have a `.env` file. If you set up a fresh clone, create `.env` from `.env.example` in the `main` worktree first.

**Prisma type errors after switching branches:** Run `pnpm prisma:generate` manually, or re-trigger hooks: `wt hook post-create`.

**Hook approval prompt:** Run `wt hook approvals add` to pre-approve all project hooks.

**Merge fails on typecheck:** Run `pnpm typecheck:affected` in the worktree, fix the errors, and re-run `wt merge`.

**Worktree directory not cleaned up:** Run `wt remove <branch>` or use the interactive picker (`wt switch`, then `Alt-r`).
