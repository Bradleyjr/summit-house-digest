# Summit House Digest — Start Here (Audrey)

This is the only page you need to read. Everything runs through **Claude** — you
talk to it in plain English, it does the technical work, and you approve.

You never edit code or HTML. Your job each week is: **gather the content, review
the preview, and approve.**

---

## One-time setup (do this once)

You need four things on your computer. If you get stuck on any step, paste the
error into Claude and ask it to help.

1. **Get the project.** Clone the repo (Brad will give you access):

   ```bash
   git clone https://github.com/Bradleyjr/summit-house-digest.git
   cd summit-house-digest
   ```

2. **Install the tools** (run inside that folder):

   ```bash
   npm install
   npx playwright install chromium
   ```

3. **Sign in to GitHub** so publishing works (this is how the site goes live):

   ```bash
   gh auth login
   ```

4. **Open the folder in Claude Code.** The Digest skill loads automatically — you
   don't have to install anything. To check it's there, just ask Claude:
   *"Do you have the Summit House Digest skill?"*

That's it. You won't do these four steps again.

---

## Every week (the ritual)

Open the project folder in Claude Code and say:

```
Start this week's Digest.
```

Claude will then:

1. Ask you which week it is.
2. Ask you for the content — birthdays, events, milestones, the staff feature,
   the lesson, and the LinkedIn posts to share. Paste notes, drop in images,
   whatever you have.
3. Walk you through each section and ask **Keep / Edit / Replace / Skip**.
4. Build the page, check it on desktop and mobile, and give you a **preview link**.
5. Wait for you to say it looks good.
6. **Publish** — and send you the live link to share.

You can stop, change your mind, or ask for a different option at any point.

---

## What you decide vs. what Claude handles

**You decide:** the content, the copy, which posts to feature, and the final
"yes, publish it."

**Claude handles:** writing the data file, rendering the page, QA (broken images,
mobile layout, no sideways scroll), previewing, and the publish/deploy.

---

## Good to know

- **The first issue's starting point** is the issue called `2026-05-25-audrey-a`.
  Claude knows to build from it.
- **Publishing** works by pushing to GitHub, which deploys the site automatically.
  You do **not** need a Netlify login. The live site is:
  `https://summit-house-digest-prototype.netlify.app`
- **It won't publish without your OK.** Claude always shows you a preview first and
  waits for your approval.
- **If something looks wrong** in the preview, tell Claude what's off — it will fix
  the content or layout and re-check before asking you again.
- **Keep the copy reader-facing.** Short and human beats long and explanatory. If a
  fact is uncertain, Claude will leave a placeholder and ask you to confirm.

---

## If you'd rather use a spreadsheet

There's an optional path where you fill a Google Sheet and export it as CSV instead
of pasting notes. See `handoff/audrey-publishing-kit/SHEET-SETUP.md`. The Claude
ritual above is simpler for most weeks.
