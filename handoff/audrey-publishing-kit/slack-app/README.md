---
type: implementation
status: draft
---

# Summit Digest Slack App

This is the Slack-native publishing assistant for Audrey.

It exposes slash commands such as:

```text
/new-digest week=2026-06-01 prev=2026-05-25-audrey-a notes="Lauren birthday, Oust review"
```

or:

```text
/summit-digest new week=2026-06-01
```

The app then:

1. Creates `context/<week-slug>/`.
2. Creates `issues/<week-slug>/issue.json` from the previous issue.
3. Pulls recent Slack channel context when `SLACK_BOT_TOKEN` has history scopes.
4. Uses Claude when `ANTHROPIC_API_KEY` is configured.
5. Falls back to the previous issue as starter candidates when Claude is not configured.
6. Walks Audrey section by section with Slack buttons.
7. Supports edit/replace through Slack modals.
8. Writes approved candidates into `issue.json`.
9. Runs validation, render, publish, and automated QA.
10. Posts a preview.
11. Requires explicit publish approval before Netlify deploy.
12. Posts the final URL in Slack.

## Run Locally

Copy env template:

```bash
cp slack-app/.env.example slack-app/.env
```

Load env and start:

```bash
set -a
source slack-app/.env
set +a
npm run slack:dev
```

Health check:

```bash
curl http://localhost:8787/health
```

Setup check:

```bash
npm run slack:setup
```

## Slack Setup

1. Render the Slack manifest:

```bash
npm run slack:manifest -- https://<public-host>
```

2. Create a Slack app from `slack-app/slack-manifest.generated.yml`.
3. If creating manually, replace `https://YOUR_PUBLIC_HOST` in `slack-app/slack-manifest.yml` with the public URL for this server.
4. For local development, expose the server with a tunnel, for example:

```bash
ngrok http 8787
```

5. Set Slash Command URL:

```text
https://<public-host>/slack/commands
```

6. Set Interactivity Request URL:

```text
https://<public-host>/slack/interactions
```

7. Install the app to the workspace.
8. Put the app credentials into `slack-app/.env`.

## Required Slack Scopes

```text
commands
chat:write
channels:history
groups:history
```

`channels:history` and `groups:history` are only needed if the app should collect recent channel context. The slash-command approval flow works without history access, but Claude will have less context.

## Deployment Gate

Automatic deploy is disabled unless this env var is set:

```text
SUMMIT_DIGEST_ENABLE_DEPLOY=true
```

Keep it `false` until the runtime has authenticated Netlify CLI access and Audrey has confirmed the approval flow.

When disabled, the bot still generates the issue and preview, then posts the manual deploy command.

## Runtime Requirements

- Node 18+ with global `fetch`.
- `npm ci` dependencies installed; Playwright is required for production QA.
- Slack signing secret.
- Slack bot token.
- Optional Anthropic API key.
- Netlify CLI auth if automatic deploy is enabled.
- The Digest project files available on the same filesystem.

## Production Deploy

See:

```text
slack-app/DEPLOYMENT.md
```

The repo includes a Dockerfile based on the Microsoft Playwright image so hosted QA can run Chromium.

## Useful Commands

```bash
npm run slack:manifest -- https://<public-host>
npm run slack:setup
npm run slack:smoke
npm run slack:test
npm run slack:dev
```

## Endpoints

```text
GET  /health
POST /slack/commands
POST /slack/interactions
```

## Notes

- `SLACK_SIGNING_SECRET` is used to verify Slack request signatures.
- If `SLACK_SIGNING_SECRET` is empty, verification is skipped for local testing.
- This app intentionally reuses the existing Digest scripts instead of duplicating publishing logic.
- Production hosting should run this behind HTTPS.
