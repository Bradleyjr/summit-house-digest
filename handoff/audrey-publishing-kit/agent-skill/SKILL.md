---
name: summit-house-digest-publisher
description: Build, QA, and publish weekly Summit House Digest issues from Audrey's notes, sheet exports, LinkedIn posts, and issue JSON.
---

# Summit House Digest Publisher

Use this skill when Audrey asks to create, update, QA, preview, or publish a Summit House Digest issue.

## Source Of Truth

Do not edit generated HTML by hand.

Update:

```text
issues/<week-slug>/issue.json
```

Then render and publish.

## Commands

Create a new issue from a previous issue:

```bash
node scripts/create-issue.mjs <new-week-slug> <previous-week-slug>
```

Import CSV sheet exports:

```bash
node scripts/import-sheet-export.mjs <week-slug> ./sheet-export
```

Validate, render, publish, QA:

```bash
node scripts/validate-issue.mjs <week-slug>
node scripts/render-issue.mjs <week-slug>
node scripts/publish-issue.mjs <week-slug>
node scripts/qa-issue.mjs <week-slug>
```

Preview:

```bash
python3 -m http.server 4173
```

Open:

```text
http://localhost:4173/digest/<week-slug>/
```

Deploy:

```bash
npx -y netlify-cli@latest deploy --prod --dir .
```

## Editorial Rules

- Keep copy reader-facing.
- Do not mention the agent or workflow in the published issue.
- Do not invent staff facts or internal details.
- Pull LinkedIn candidates only from approved source accounts.
- Default lookback is prior 7 days.
- Ask Audrey to confirm sensitive people/culture details.

## QA Rules

Always run automated QA and visual QA.

Desktop checks:

- no console errors
- no broken images
- no horizontal scroll
- This Week card controls work
- Staff Feature image hover works without clipping
- Business Unit hover previews work
- Sharing controls/progress work

Mobile checks:

- no horizontal scroll
- Staff Feature images have no unwanted white backgrounds
- Business Unit type does not collide
- Sharing images do not double expose or collapse

## Done Response

Report:

- issue slug
- preview URL
- production URL if deployed
- files changed
- commands run
- remaining confirmations

