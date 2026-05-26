# Deploying The Summit Digest Slack App

The Slack app must be hosted behind HTTPS so Slack can reach:

```text
POST /slack/commands
POST /slack/interactions
GET  /health
```

## Recommended MVP Host

Use a Docker-capable host such as Render, Fly, Railway, or any small VM.

The repo includes:

```text
Dockerfile
slack-app/render.yaml.example
```

The Docker image uses Microsoft's Playwright base image so `node scripts/qa-issue.mjs` can run browser QA in production.

## Required Environment

```text
SLACK_SIGNING_SECRET=...
SLACK_BOT_TOKEN=xoxb-...
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
SUMMIT_DIGEST_PREVIOUS_ISSUE=2026-05-25-audrey-a
SUMMIT_DIGEST_PUBLIC_BASE_URL=https://summit-house-digest-prototype.netlify.app
SUMMIT_DIGEST_SHARE_CHANNEL=C...
SUMMIT_DIGEST_ENABLE_DEPLOY=false
```

Set `SUMMIT_DIGEST_ENABLE_DEPLOY=true` only after:

- the Slack approval flow has been tested in the workspace,
- Netlify CLI auth works in the runtime,
- Audrey has confirmed the preview/publish approval language.

## Slack App Setup

Render the workspace-specific Slack manifest:

```bash
npm run slack:manifest -- https://<public-host>
```

Then create the Slack app from:

```text
slack-app/slack-manifest.generated.yml
```

If creating the app manually instead, replace every `https://YOUR_PUBLIC_HOST` in `slack-app/slack-manifest.yml` with the deployed host URL.

Required URLs:

```text
https://<public-host>/slack/commands
https://<public-host>/slack/interactions
```

Required scopes:

```text
commands
chat:write
channels:history
groups:history
```

Invite the bot to the channel where Audrey will run the digest workflow.

## Netlify Deploy Auth

Automatic publishing uses:

```bash
npx -y netlify-cli@latest deploy --prod --dir .
```

The runtime needs Netlify authentication. For a hosted service, configure the Netlify CLI auth/token according to the host's secret mechanism before enabling deploys.

Until then, keep:

```text
SUMMIT_DIGEST_ENABLE_DEPLOY=false
```

The bot will still generate the preview and post the manual deploy command after approval.

## Persistence

The bot writes weekly state to:

```text
context/<week-slug>/
issues/<week-slug>/issue.json
digest/<week-slug>/index.html
```

For a real production bot, use one of these persistence strategies:

1. Run on a persistent VM or mounted volume.
2. Commit generated issue files back to a repository in a later hardening pass.
3. Move issue/session state into a database or object storage.

The current MVP is file-backed because it matches the existing Digest publisher.

## Smoke Check

Before connecting Slack:

```bash
npm ci
npm run slack:manifest -- https://<public-host>
npm run slack:setup
npm run slack:smoke
npm run slack:test
npm run slack:dev
curl http://localhost:8787/health
```
