# Weekly Publishing Checklist

## 1. Prepare Inputs

- [ ] Confirm week slug.
- [ ] Confirm previous issue slug.
- [ ] Fill or export sheet tabs.
- [ ] Gather images/screenshots.
- [ ] Confirm selected LinkedIn posts.
- [ ] Confirm birthdays/events/milestones/watch items.

## 2. Generate Issue

```bash
node scripts/create-issue.mjs <week-slug> <previous-week-slug>
node scripts/import-sheet-export.mjs <week-slug> ./sheet-export
node scripts/validate-issue.mjs <week-slug>
node scripts/render-issue.mjs <week-slug>
node scripts/publish-issue.mjs <week-slug>
```

If not using CSV, update `issues/<week-slug>/issue.json` directly before validation.

## 3. Preview

```bash
python3 -m http.server 4173
```

Open:

```text
http://localhost:4173/digest/<week-slug>/
```

## 4. QA

```bash
node scripts/qa-issue.mjs <week-slug>
```

Also visually check:

- [ ] desktop top-to-bottom
- [ ] mobile top-to-bottom
- [ ] This Week arrows
- [ ] Staff Feature image hover on desktop
- [ ] Staff Feature mobile image backgrounds
- [ ] Business Unit mobile type
- [ ] Sharing mobile image stack
- [ ] no horizontal scroll

## 5. Deploy

```bash
npx -y netlify-cli@latest deploy --prod --dir .
```

## 6. Send

Send Audrey:

- production URL
- issue slug
- anything still needing confirmation

