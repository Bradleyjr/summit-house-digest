# Summit House Digest Publishing Kit

This kit is the handoff package for Audrey to publish future Summit House Digest issues without editing HTML.

The Digest is generated from issue data:

```text
issues/<week-slug>/issue.json
```

Audrey or her agent updates the issue data, runs the render/publish commands, QA's the result, and deploys it.

## What Is Included

- `AUDREY-OPERATING-GUIDE.md` - the plain-English weekly workflow.
- `AGENT-INSTRUCTIONS.md` - instructions Audrey can paste into her agent.
- `WEEKLY-CHECKLIST.md` - short checklist for each issue.
- `SHEET-SETUP.md` - spreadsheet tabs and required fields.
- `QA-CHECKLIST.md` - desktop/mobile QA before sending.
- `DEPLOYMENT.md` - preview and Netlify deploy instructions.
- `AGENT-NATIVE-WIZARD.md` - the more agent-forward guided workflow.
- `SLACK-AGENT.md` - the Slack slash-command bot setup and operating guide.
- `agent-skill/SKILL.md` - portable skill file for Audrey's agent.
- `wizard-skill/summit-house-digest-wizard/` - skill that guides Audrey through a weekly approval wizard.
- `slack-app/` - Slack slash-command app for `/new-digest`.
- `sheet-templates/*.csv` - starter CSV files for the Google Sheet/export workflow.

## Current Published Prototype

Production URL:

```text
https://summit-house-digest-prototype.netlify.app/digest/2026-05-25-audrey-a/
```

Current source issue:

```text
issues/2026-05-25-audrey-a/issue.json
```

## Quick Start

From the project root:

```bash
node scripts/create-issue.mjs 2026-06-01 2026-05-25-audrey-a
node scripts/import-sheet-export.mjs 2026-06-01 ./sheet-export
node scripts/validate-issue.mjs 2026-06-01
node scripts/render-issue.mjs 2026-06-01
node scripts/publish-issue.mjs 2026-06-01
node scripts/qa-issue.mjs 2026-06-01
npx -y netlify-cli@latest deploy --prod --dir .
```

If Audrey is not using CSV exports yet, skip the import command and have the agent update `issues/<week-slug>/issue.json` directly.

## Optional Agent Skill Install

If Audrey wants the basic publisher skill, copy this folder:

```text
handoff/audrey-publishing-kit/agent-skill
```

to:

```text
~/.codex/skills/summit-house-digest-publisher
```

Then Audrey can ask:

```text
Use the summit-house-digest-publisher skill to publish this week's Digest.
```

If Audrey wants the agent-native guided workflow, copy this folder instead:

```text
handoff/audrey-publishing-kit/wizard-skill/summit-house-digest-wizard
```

to:

```text
~/.codex/skills/summit-house-digest-wizard
```

Then Audrey can ask:

```text
Use the Summit House Digest Wizard to start this week's issue.
```

## Slack Bot Workflow

The easiest Audrey-facing workflow is the Slack app:

```text
/new-digest week=2026-06-01 prev=2026-05-25-audrey-a
```

The Slack app walks Audrey through section approvals, writes `issue.json`, runs render/QA, posts a preview, and gates production deploy behind explicit approval.

See:

```text
slack-app/README.md
```

For deployment, use the full app bundle rather than this lightweight handoff folder:

```text
handoff/summit-digest-slack-app-bundle.zip
```

That bundle includes the Slack app, scripts, current issue seed, assets, package files, and Dockerfile needed to run the bot.
