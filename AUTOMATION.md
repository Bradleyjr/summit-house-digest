# Summit House Digest — Weekly Automation

Fully automated weekly publishing. No local machine required.

## How it runs

1. **Monday 9:03 AM ET — Draft (remote Claude agent)**
   Gathers Slack + Google Calendar context, drafts the week's `issue.json`,
   renders it, DMs Brad the draft in Slack, and pushes the draft to this repo.

2. **You review in Slack**
   Reply `APPROVE` to publish, or describe changes.

3. **Monday 2:07 PM ET — Approval check (remote Claude agent)**
   Reads your Slack reply. If approved, it pushes the final issue to `main`.

4. **GitHub Actions — Deploy**
   Any push touching `digest/`, `issues/`, `assets/`, `index.html`, or
   `styles.css` triggers `.github/workflows/deploy.yml`, which deploys the
   site to Netlify production. The deploy runs in GitHub's runners using the
   `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` repo secrets — no local
   credentials needed.

## Why this architecture

- Local `durable` cron does not persist to disk in this environment, and the
  org blocks the headless `claude` CLI — so reliable scheduling must be remote.
- Netlify/GitHub credentials live locally, so deploy is delegated to GitHub
  Actions (which holds the Netlify token as a secret) rather than the cloud agent.

## Routines

- `summit-house-digest-weekly-draft` (cron `3 13 * * 1` UTC = Mon 9:03 AM ET)
- `summit-house-digest-approval-check` (cron `7 18 * * 1` UTC = Mon 2:07 PM ET)

Manage at https://claude.ai/code/routines

## Secrets (GitHub repo)

- `NETLIFY_AUTH_TOKEN` — Netlify personal access token
- `NETLIFY_SITE_ID` — `30662845-713f-47fd-89f4-78deb78e80ea`
