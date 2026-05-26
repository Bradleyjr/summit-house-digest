# Agent-Native Wizard Flow

This is the recommended next workflow for Audrey.

Instead of Audrey filling every field in a spreadsheet, the agent gathers company context, proposes the issue, and asks Audrey to approve/edit section by section.

## The Weekly Flow

```text
Audrey: Start this week's Digest.
        ↓
Agent creates context/<week-slug>/
        ↓
Agent gathers Slack/Calendar/Drive/LinkedIn/notes context
        ↓
Agent proposes candidates by section
        ↓
Audrey chooses Keep / Edit / Replace / Skip
        ↓
Agent writes issue.json
        ↓
Agent renders and QA's preview
        ↓
Audrey approves production deploy
        ↓
Agent deploys
```

## What Audrey Sees

The agent should guide Audrey with short prompts, for example:

```text
I found four This Week items:
1. Birthdays: Lauren and Matt
2. Events: Thursday reviews
3. Milestones: ops and creative wins
4. Watch: room/calendar conflict

Keep, edit, replace, or skip?
```

Or:

```text
I found three possible Staff Feature angles:
1. Audrey making the Digest a weekly ritual
2. Oust campaign review becoming sharper
3. Wild Places Effects language cleanup

Which one should lead?
```

## Files Created Per Week

```text
context/<week-slug>/
  raw/
  candidates.json
  digest-brief.md
  approvals.json
```

These files let Audrey see where the draft came from and what she approved.

## Skill To Install

Install or copy:

```text
handoff/audrey-publishing-kit/wizard-skill/summit-house-digest-wizard
```

to Audrey's skill folder:

```text
~/.codex/skills/summit-house-digest-wizard
```

Then Audrey can say:

```text
Use the Summit House Digest Wizard to start this week's issue.
```

## Connector Roadmap

The wizard works now with pasted notes and uploaded files. To make it more autonomous, connect:

- Slack for weekly signals.
- Google Calendar for events, OOO, reviews.
- Google Drive for images and post captures.
- LinkedIn/browser for public sharing candidates.

The skill is written so those sources can be added without changing the publishing structure.

