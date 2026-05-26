# Audrey Operating Guide

The weekly job is not to design a new site. The weekly job is to fill the Digest template with the right information, QA it, and publish.

## Weekly Rhythm

1. Pick the issue Monday date.

Example:

```text
2026-06-01
```

2. Gather source material.

Use the sheet tabs in `SHEET-SETUP.md`, plus any LinkedIn posts, images, screenshots, or internal notes that should be included.

3. Ask the agent to create the new issue.

Give the agent:

- the week slug
- the previous issue slug
- the completed sheet export folder, or the notes directly
- any image files
- final publishing deadline

4. Review the local preview.

Preview route:

```text
http://localhost:4173/digest/<week-slug>/
```

5. Approve final copy and visuals.

Only approve after desktop and mobile QA pass.

6. Deploy.

Use the deploy command in `DEPLOYMENT.md`.

## What Audrey Should Edit

Audrey should edit content only:

- issue number
- week label
- masthead headline
- This Week items
- Staff Feature copy/images
- Business Unit notes
- Lesson Learned copy/image
- Sharing posts

Audrey should not edit:

- `index.html`
- `digest/<slug>/index.html`
- layout classes
- animation code
- CSS unless making an intentional design change

## Recommended Sheet Workflow

Use one Google Sheet per issue with these tabs:

- `issue`
- `this-week`
- `lead-feature`
- `business-units`
- `lessons`
- `sharing`

Export the tabs as CSV into one folder named `sheet-export`, then run:

```bash
node scripts/import-sheet-export.mjs <week-slug> ./sheet-export
```

The CSV templates in this kit match the importer.

## Recommended Agent Wizard Workflow

The more agent-native version is simpler for Audrey:

```text
Audrey: Use the Summit House Digest Wizard to start this week's issue.
```

The agent then gathers context, proposes each section, and asks Audrey to choose:

```text
Keep / Edit / Replace / Skip
```

Use `AGENT-NATIVE-WIZARD.md` when setting that up.

## Editorial Rules

- Keep copy reader-facing.
- Do not describe agent workflow in the issue.
- Avoid internal process language unless it matters to the reader.
- Prefer one sharp sentence over three explanatory ones.
- If something is uncertain, leave a placeholder and ask for confirmation.
- Use prior-week LinkedIn posts only unless Brad/Audrey asks for a wider lookback.

## Final Approval Standard

The issue is ready when:

- Audrey has reviewed the copy.
- The agent has run validation, render, publish, and QA.
- Desktop looks clean.
- Mobile looks clean.
- No broken images or console errors.
- The production URL opens correctly.
