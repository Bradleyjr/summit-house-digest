# Summit House Digest Agent Publishing Plan

The publishing system should stay light until the editorial workflow proves itself. The near-term product is not a CMS. It is a data-driven issue template plus an agent that prepares the data.

## System Shape

```text
Google Sheets / Audrey notes / LinkedIn
        |
        v
Summit House Digest publisher agent
        |
        v
issues/<week-slug>/issue.json
        |
        v
scripts/render-issue.mjs
        |
        v
index.html / preview / deploy
```

## What Can Be Automated

The agent can reliably prepare:

- Prior-week LinkedIn candidate list from the fixed source accounts.
- Candidate summaries and why each one matters.
- Suggested post screenshots or image captures.
- Drafted section copy in the Summit House editorial voice.
- Weekly issue JSON.
- Local preview and visual QA checklist.

The agent should ask Audrey or Brad to confirm:

- Which LinkedIn posts make the final issue.
- Any sensitive people/culture notes.
- Birthdays, anniversaries, OOO, and internal calendar details if not provided in the sheet.
- Final publish approval.

## Skill Workflow

1. **Create issue folder**
   - Copy the previous issue folder.
   - Rename to the new Monday date, for example `issues/2026-06-01`.

2. **Collect source material**
   - Use Chrome for LinkedIn because the account/session matters.
   - Restrict to the prior week only.
   - Save candidate notes, screenshots, and URLs.

3. **Draft issue data**
   - Start from Audrey's sheet or notes.
   - Fill missing sections only when the source material supports it.
   - Keep copy reader-facing. Never write workflow/admin copy like "the agent checks..."

4. **Render**
   - Run `node scripts/validate-issue.mjs <week-slug>`.
   - Run `node scripts/render-issue.mjs <week-slug>`.
   - Run `node scripts/publish-issue.mjs <week-slug>`.

5. **QA**
   - Run `node scripts/qa-issue.mjs <week-slug>`.
   - Start server from `digest-prototype`: `python3 -m http.server 4173`.
   - Open `http://localhost:4173/digest/<week-slug>/`.
   - Check console errors, broken images, overflow, carousel, hover previews, and footer cat.

6. **Publish**
   - For now, hand off the preview.
   - Later, deploy the generated issue route to Netlify/Vercel.

## Future Sheet Importer

The first practical automation is `scripts/import-sheet-export.mjs`, which turns exported CSV tabs into `issue.json`.

Example:

```bash
node scripts/import-sheet-export.mjs 2026-06-01 ./sheet-export
node scripts/validate-issue.mjs 2026-06-01
node scripts/render-issue.mjs 2026-06-01
node scripts/publish-issue.mjs 2026-06-01
node scripts/qa-issue.mjs 2026-06-01
```

Do this after Audrey confirms the spreadsheet tabs feel natural.
