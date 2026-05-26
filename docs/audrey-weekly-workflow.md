# Summit House Digest Weekly Workflow

This version keeps Audrey out of the HTML. The site is generated from one issue data file:

```text
issues/2026-05-25/issue.json
```

For a new week, create the new issue from the previous one:

```bash
node scripts/create-issue.mjs 2026-06-01 2026-05-25
```

Then update the fields and render:

```bash
node scripts/render-issue.mjs 2026-06-01
node scripts/publish-issue.mjs 2026-06-01
```

The rendered homepage is still `index.html`, so the design remains static and easy to preview. The publisher also creates a permanent per-issue preview route:

```text
http://localhost:4173/digest/2026-06-01/
```

The difference is that the editable content now lives in JSON, which can later be produced from Google Sheets or an agent run.

## What Audrey Edits

Audrey should only need to change these fields:

- `issueNumber`
- `weekLabel`
- `masthead.headline`
- `masthead.dek`
- `week.cards`
- `feature`
- `businessUnits.notes`
- `lessons`
- `sharing.posts`

She should not edit:

- layout classes
- animation code
- footer/logo/mascot structure
- GSAP behavior
- generated HTML

## Suggested Google Sheet Tabs

Use one workbook per issue, or one master workbook with a `week_slug` column.

### Issue

| field | value |
| --- | --- |
| slug | 2026-06-01 |
| issueNumber | 05 |
| weekLabel | Week of June 1 |
| mastheadHeadline | A weekly house note for work in motion. |
| mastheadDek | The useful things, the sharp things, and the human things from across the studio. |

### This Week

| label | count | text | variant |
| --- | --- | --- | --- |
| Shoots | 3 | Atlanta studio, Oust brand capture, Ritual client day. | wide |
| Birthdays | 2 | Lauren S. and Matt P. |  |
| Anniversaries | 4 | Creative, production, and ops milestones. |  |
| OOO | 6 | Check calendar before booking Thursday reviews. | dark |

### Lead Feature

| field | value |
| --- | --- |
| kicker | Employee highlight |
| title | Audrey is turning the Digest into a real weekly ritual. |
| body | She is shaping a weekly rhythm for the house... |
| image_1 | assets/images/generated/signal-ritual.png |
| image_2 | assets/images/generated/signal-oust.png |
| image_3 | assets/images/generated/signal-wild-places.png |
| image_4 | assets/images/generated/signal-meridian.png |

### Business Units

| unit | text | preview |
| --- | --- | --- |
| Summit House | The house note has a clearer shape for what matters each week. | assets/images/generated/cat-paper-sighting.png |
| Oust | New campaign review is ready for leadership. | assets/images/generated/signal-oust.png |

### Lessons

| field | value |
| --- | --- |
| title | Leave room for the thing that makes the work memorable. |
| body | The fastest version is not always the smallest one... |
| image | assets/images/generated/lesson-still-life.png |
| credit | Shared by BU leads / edited for the issue |

### Sharing

| source | index | unit | title | caption | image | url |
| --- | --- | --- | --- | --- | --- | --- |
| Summit House / LinkedIn | 01 | Summit House | A good post should not disappear just because the feed moved on. | Post capture | assets/images/generated/cat-paper-sighting.png |  |

## Agent Responsibilities

The agent should do the parts that are tedious or error-prone:

1. Collect prior-week LinkedIn candidates from the approved account list in `issue.json`.
2. Pull screenshots or image assets for selected posts.
3. Draft concise, reader-facing copy. Avoid admin/process copy.
4. Update the new issue JSON.
5. Run `node scripts/render-issue.mjs <slug>`.
6. Preview locally with `python3 -m http.server 4173`.
7. Browser-QA:
   - no broken images
   - no console errors
   - no horizontal scroll
   - carousel progress works
   - section headings do not clip
   - footer has one large background cat

## Later

Once the issue JSON shape feels stable, connect Google Sheets:

1. Export each tab as CSV or read through the Sheets API.
2. Convert sheet rows into `issue.json`.
3. Run the same renderer.
4. Deploy or publish the resulting issue route.

The first CSV importer exists now:

```bash
node scripts/import-sheet-export.mjs 2026-06-01 ./sheet-export
node scripts/validate-issue.mjs 2026-06-01
node scripts/render-issue.mjs 2026-06-01
node scripts/publish-issue.mjs 2026-06-01
node scripts/qa-issue.mjs 2026-06-01
```

The export folder should contain any of these CSV files:

- `issue.csv`
- `this-week.csv`
- `lead-feature.csv`
- `business-units.csv`
- `lessons.csv`
- `sharing.csv`

Starter copies of each CSV are in `sheet-templates/`.
