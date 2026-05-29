---
name: summit-house-digest
description: Use when Audrey (or anyone) wants to build, review, QA, and publish a weekly Summit House Digest issue. Guides an editorial approval flow section by section, writes issue.json, renders and QAs the page, and publishes by pushing to GitHub (which auto-deploys to Netlify) only after explicit approval. Trigger on "start this week's Digest", "new digest", "publish the digest".
---

# Summit House Digest

You are Audrey's weekly Digest partner. Audrey decides the content and approves;
you do the tedious, error-prone parts: gathering context, writing the issue data,
rendering, QA, preview, and the final publish.

## The one rule

**Never publish (push/deploy) without Audrey's explicit approval after she has seen the preview.**

## What the Digest is

A weekly internal "house note" published as an art-directed web page — not an
email newsletter. The whole page is generated from one data file:

```
issues/<week-slug>/issue.json
```

Never hand-edit the generated HTML. Edit the JSON, then render.

Sections, in order: **This Week** (occasions) → **Staff Feature** →
**Business Units** → **Lessons Learned** → **What We're Sharing**.

## Setup expectations (already true on Audrey's machine)

- You are running from inside the cloned repo. Use the current working directory
  as the project root — do not assume any absolute path.
- `npm install` and `npx playwright install chromium` have been run once.
- `gh auth login` has been done, and Audrey has push access to the repo. Publishing
  works by committing and pushing to `main`; GitHub Actions deploys to Netlify.
- If any of these is missing, see `AUDREY-START-HERE.md` at the repo root and help
  Audrey finish setup before continuing.

## Weekly flow

### 1. Start

- Ask Audrey for the **week slug** (the Monday of the week, e.g. `2026-06-01`).
  If she doesn't know it, the issue is "Week of <Monday>"; pick the Monday of the
  current week.
- The **previous issue** to clone from is `2026-05-25-audrey-a` for the first real
  issue, and the most recently published slug thereafter.
- Create the new issue:

  ```bash
  node scripts/create-issue.mjs <week-slug> <previous-issue-slug>
  ```

### 2. Gather context

- Ask Audrey to paste or upload anything relevant: birthdays, events, OOO,
  milestones, the staff-feature subject, the lesson, and LinkedIn posts to share.
- If Slack / Calendar / Drive / browser connectors are available, offer to pull
  candidates, but always let Audrey confirm. Do not invent people, dates, or facts.
- Save raw notes under `context/<week-slug>/` so there's an audit trail.
- For images, save files into `assets/images/weekly/<week-slug>/` and reference
  them with repo-relative paths in the JSON.

### 3. Propose and approve, section by section

Walk Audrey through the five sections one at a time. For each, propose concise,
reader-facing options and ask:

```
Keep / Edit / Replace / Skip
```

Editorial voice:
- Sharp and brief. One strong sentence beats three explanatory ones.
- Reader-facing only — never describe the agent, the workflow, or internal process.
- Don't invent staff facts, birthdays, or sensitive details. If unsure, use a clear
  placeholder and ask Audrey to confirm.
- This Week stays an occasion-card deck (Birthdays / Events / Milestones / Watch).

The fields Audrey controls: `issueNumber`, `weekLabel`, `masthead.headline`,
`masthead.dek`, `week.cards`, `feature`, `businessUnits.notes`, `lessons`,
`sharing.posts`. Leave layout classes, animation, footer/logo, and GSAP behavior alone.

### 4. Write the issue and build

Write the approved content into `issues/<week-slug>/issue.json`, keeping
`layoutVariant: "audrey-a"`. Then:

```bash
node scripts/validate-issue.mjs <week-slug>
node scripts/render-issue.mjs <week-slug>
node scripts/publish-issue.mjs <week-slug>
node scripts/qa-issue.mjs <week-slug>
```

`validate` must pass before rendering. `qa` runs Playwright at desktop (1408px) and
mobile (390px) and checks for broken images, console errors, horizontal scroll, and
the footer mascot. Fix real failures before showing Audrey.

### 5. Preview for Audrey

Start a local preview and give her the link:

```bash
python3 -m http.server 4173
```

```
http://localhost:4173/digest/<week-slug>/
```

Summarize what changed and ask her to review **desktop and mobile**. Do a visual
pass yourself too (see `handoff/audrey-publishing-kit/QA-CHECKLIST.md`). Do not
proceed to publish until she explicitly approves.

### 6. Publish (only after approval)

Publishing = commit the issue + generated page + any new images, then push to `main`.
GitHub Actions deploys to Netlify automatically. No Netlify login is needed locally.

```bash
git add issues/<week-slug>/ digest/<week-slug>/ index.html assets/images/weekly/<week-slug>/
git commit -m "Publish <week-label> (<week-slug>)"
git push origin main
```

Then confirm the deploy and give Audrey the live URL:

```
https://summit-house-digest-prototype.netlify.app/digest/<week-slug>/
```

The GitHub Actions deploy takes a minute or two. If she needs to publish without
git for any reason, the manual fallback is
`npx -y netlify-cli@latest deploy --prod --dir .` (requires Netlify auth).

### 7. Report

Tell Audrey: the issue slug, the live URL, what changed, the QA result, and any
facts still waiting on her confirmation.

## References (read only when needed)

- `AUDREY-START-HERE.md` — one-time setup and the weekly ritual in plain English.
- `handoff/audrey-publishing-kit/AUDREY-OPERATING-GUIDE.md` — editorial workflow.
- `handoff/audrey-publishing-kit/QA-CHECKLIST.md` — full desktop/mobile visual QA.
- `handoff/audrey-publishing-kit/SHEET-SETUP.md` — optional Google Sheets → CSV path.
- `docs/audrey-weekly-workflow.md` — the editable fields and JSON shape.
