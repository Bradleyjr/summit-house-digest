# Summit House Digest Slack Agent

The Slack agent is the easiest Audrey-facing workflow.

Audrey can start with:

```text
/new-digest week=2026-06-01 prev=2026-05-25-audrey-a notes="anything important this week"
```

The app then runs the same publishing pipeline already used by the prototype:

```text
Slack slash command
  -> slack-app/server.mjs
  -> context/<week-slug>/
  -> issues/<week-slug>/issue.json
  -> validate/render/publish/QA
  -> preview approval
  -> explicit publish approval
  -> Netlify deploy
  -> Slack final link
```

## What Exists

```text
slack-app/server.mjs
slack-app/smoke-test.mjs
slack-app/integration-test.mjs
slack-app/setup-check.mjs
slack-app/render-manifest.mjs
slack-app/.env.example
slack-app/slack-manifest.yml
slack-app/DEPLOYMENT.md
slack-app/README.md
Dockerfile
```

## Deployment Bundle

A runnable deployment bundle is packaged at:

```text
handoff/summit-digest-slack-app-bundle.zip
```

It includes the Slack app, current Design A seed issue, publisher scripts, required assets, package files, and Dockerfile.

Package scripts:

```bash
npm run slack:dev
npm run slack:manifest -- https://<public-host>
npm run slack:setup
npm run slack:smoke
npm run slack:test
```

## Slash Commands

Recommended command:

```text
/new-digest
```

Supported management command:

```text
/summit-digest
```

Supported parameters:

```text
week=2026-06-01
prev=2026-05-25-audrey-a
notes="Lauren birthday, Oust review, Thursday handoff"
```

If `week` is omitted, the app defaults to the next Monday.

If `prev` is omitted, the app defaults to `SUMMIT_DIGEST_PREVIOUS_ISSUE`, currently intended to be `2026-05-25-audrey-a`.

## Approval Flow

The app walks Audrey through:

1. This Week
2. Staff Feature
3. Business Units
4. Lessons Learned
5. What We're Sharing
6. Preview approval
7. Publish approval

Each section supports:

- Keep
- Edit
- Replace
- Skip

Edit and Replace open a Slack modal. Keep/Skip advance to the next section.

After the final section, the app runs:

```bash
node scripts/validate-issue.mjs <week-slug>
node scripts/render-issue.mjs <week-slug>
node scripts/publish-issue.mjs <week-slug>
node scripts/qa-issue.mjs <week-slug>
```

## Claude Behavior

If `ANTHROPIC_API_KEY` is configured, the app asks Claude to draft candidates using:

- prior approved issue JSON,
- Audrey's slash-command notes,
- recent Slack channel context when available.

If `ANTHROPIC_API_KEY` is not configured, the app falls back to the previous issue as starter candidates. This makes the command testable before credentials are available.

## Slack Context

If `SLACK_BOT_TOKEN` has history scopes, the app pulls up to 100 recent channel messages across the configured lookback window.

Required scopes:

```text
commands
chat:write
channels:history
groups:history
```

The app saves Slack context to:

```text
context/<week-slug>/raw/slack-context.json
```

## Deploy Gate

Production deploy is disabled unless:

```text
SUMMIT_DIGEST_ENABLE_DEPLOY=true
```

Keep it false until the runtime has Netlify auth and Audrey has tested preview approvals.

When deploy is disabled, the bot still builds the issue and posts the manual deploy command.

## Runtime Environment

Use `slack-app/.env.example` as the template.

Required for real Slack:

```text
SLACK_SIGNING_SECRET
SLACK_BOT_TOKEN
```

Required for Claude drafting:

```text
ANTHROPIC_API_KEY
```

Required for automatic Netlify deploy:

```text
SUMMIT_DIGEST_ENABLE_DEPLOY=true
```

The runtime also needs Netlify CLI auth.

Before connecting the real Slack app, run:

```bash
npm run slack:manifest -- https://<public-host>
npm run slack:setup
```

## Production Packaging

The repo includes a Dockerfile using the Microsoft Playwright image so `node scripts/qa-issue.mjs` can run in production.

See:

```text
slack-app/DEPLOYMENT.md
```

## Verification

Local checks that passed during build:

```bash
node --check slack-app/server.mjs
npm run slack:manifest -- https://example.com
npm run slack:setup
npm run slack:smoke
npm run slack:test
node scripts/validate-issue.mjs 2026-05-25-audrey-a
```

Manual local slash simulation also passed:

- `POST /slack/commands` created `context/<week>/` and `issues/<week>/issue.json`.
- Five `digest_keep_section` interactions advanced through all sections.
- Final section ran validate/render/publish/QA.
- The smoke issue generated `digest/<week>/index.html`.
- Smoke artifacts were cleaned up.
