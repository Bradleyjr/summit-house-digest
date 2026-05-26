# Summit House Digest Prototype

Static design prototype and first-pass publishing pipeline for the weekly Summit House Digest.

Open:

- `index.html`, or serve locally with `python3 -m http.server 4173`

Render current issue:

```bash
node scripts/render-issue.mjs 2026-05-25
```

Create a new weekly issue:

```bash
node scripts/create-issue.mjs 2026-06-01 2026-05-25
```

Import Audrey's Google Sheets CSV exports:

```bash
node scripts/import-sheet-export.mjs 2026-06-01 ./sheet-export
node scripts/validate-issue.mjs 2026-06-01
node scripts/render-issue.mjs 2026-06-01
node scripts/publish-issue.mjs 2026-06-01
node scripts/qa-issue.mjs 2026-06-01
```

Starter CSV tabs live in `sheet-templates/`.

Published issue preview URLs follow:

```text
http://localhost:4173/digest/2026-06-01/
```

Slack agent workflow:

```bash
npm run slack:dev
```

The Slack app lives in `slack-app/` and supports `/new-digest` with section-by-section approval, optional Claude drafting, local render/QA, and explicit publish approval before Netlify deploy. See `docs/slack-agent-publishing.md`.

Current source of truth:

- `issues/2026-05-25/issue.json`
- `docs/audrey-weekly-workflow.md`
- `docs/agent-publishing-plan.md`
- `docs/slack-agent-publishing.md`

Design intent:

- Editorial issue, not newsletter template.
- Typography is a primary visual element.
- Strict invisible grid with asymmetrical composition.
- Compact utility section before the larger editorial spread.
- One art-directed lead feature moment.
- BU highlights as a mosaic, not equal cards.
- Lessons Learned as a type-led section.
- LinkedIn / Development as a paired lower editorial module.

Current assets:

- Uses local Summit House Figma export images as placeholder visual material.
- Uses official Summit House logotype/logomark crops from the Figma logo export.
- Uses `assets/images/hero-treated-landscape.png`, generated with the built-in `$imagegen` workflow for the masthead background.
- Uses local Inter Tight font file.
- Uses the activated Adobe Fonts family `IvyPresto Headline` from the system font registry.
- Do not copy the Adobe font files into the project unless licensing/export terms allow it. For a deployed site, load IvyPresto through the approved Adobe Fonts kit or another licensed webfont source.

Image generation prompt:

```text
Create a visually treated editorial background image inspired by experimental print photography: luminous blue sky-like field, deep green hill or upholstered surface, subtle paper/fabric grain, risograph/screenprint/halftone treatment, imperfect folded grid seams, strong left-side negative space for masthead typography, Summit House palette influence, no text, no logos, no watermark.
```

Verification:

- Rendered with Playwright at `1440 x 1200` and `390 x 1200`.
- Browser font check confirmed `IvyPresto Headline` is available.
- No horizontal overflow detected.
- All local images loaded successfully.
