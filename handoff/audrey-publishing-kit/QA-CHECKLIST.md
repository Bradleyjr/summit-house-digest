# QA Checklist

Run automated QA:

```bash
node scripts/qa-issue.mjs <week-slug>
```

Then do a visual pass.

## Desktop

- [ ] Masthead image and logo render.
- [ ] Navigation links scroll to sections.
- [ ] This Week card stack looks editorial.
- [ ] This Week arrows cycle cards.
- [ ] Staff Feature images are not clipped by the section.
- [ ] Staff Feature hover motion works and does not crop images.
- [ ] Business Unit section type has enough breathing room.
- [ ] Business Unit hover previews work.
- [ ] Lessons image and headline do not clip.
- [ ] Sharing section images are readable.
- [ ] Sharing controls work.
- [ ] Footer has one large mascot.

## Mobile

Use a 390px wide viewport.

- [ ] No horizontal scroll.
- [ ] Staff Feature images have transparent backgrounds.
- [ ] Staff Feature images do not show unwanted white cards.
- [ ] Business Unit display type does not overlap or stack into itself.
- [ ] Sharing images are single-column and not double exposed.
- [ ] Sharing post captions remain readable.
- [ ] This Week card stack is usable.
- [ ] Footer does not crowd content.

## Failure Rule

If a section looks wrong visually, do not rely only on computed CSS. Take a screenshot and inspect the actual rendered layout.

