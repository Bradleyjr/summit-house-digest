import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const issueSlug = process.argv[2] || "2026-05-25";
const issuePath = path.join(projectRoot, "issues", issueSlug, "issue.json");

const issue = JSON.parse(await fs.readFile(issuePath, "utf8"));
const failures = [];
const warnings = [];

const requireText = (label, value, { min = 1, max = 220 } = {}) => {
  const text = String(value || "").trim();
  if (!text) failures.push(`${label} is missing.`);
  if (text && text.length < min) warnings.push(`${label} is very short (${text.length} chars).`);
  if (text.length > max) warnings.push(`${label} is long (${text.length} chars, target <= ${max}).`);
  return text;
};

const checkAsset = async (label, value) => {
  const src = String(value || "").trim();
  if (!src) {
    failures.push(`${label} is missing.`);
    return;
  }
  if (/^https?:\/\//.test(src)) return;
  try {
    await fs.access(path.join(projectRoot, src));
  } catch {
    failures.push(`${label} does not exist: ${src}`);
  }
};

const noAdminCopy = (label, value) => {
  const text = String(value || "").toLowerCase();
  const banned = ["agent checks", "source list", "before publish", "issue data", "chrome gathers"];
  banned.forEach((phrase) => {
    if (text.includes(phrase)) failures.push(`${label} contains admin/process copy: "${phrase}".`);
  });
};

requireText("title", issue.title, { max: 80 });
requireText("issueNumber", issue.issueNumber, { max: 8 });
requireText("weekLabel", issue.weekLabel, { max: 40 });
requireText("masthead.headline", issue.masthead?.headline, { max: 90 });
if (issue.masthead?.dek) requireText("masthead.dek", issue.masthead.dek, { max: 180 });
await checkAsset("masthead.logo.src", issue.masthead?.logo?.src);

requireText("week.title", issue.week?.title, { max: 80 });
if (!Array.isArray(issue.week?.cards) || (issue.week.variant === "single-block" ? issue.week.cards.length !== 1 : issue.week.cards.length !== 4)) {
  failures.push(issue.week?.variant === "single-block" ? "week.cards should contain exactly 1 card for single-block weeks." : "week.cards should contain exactly 4 cards.");
} else {
  issue.week.cards.forEach((card, index) => {
    requireText(`week.cards[${index}].label`, card.label, { max: 22 });
    requireText(`week.cards[${index}].text`, card.text, { max: 120 });
    if (issue.week.variant !== "single-block" && !Number.isFinite(Number(card.count))) failures.push(`week.cards[${index}].count should be numeric.`);
    if (Array.isArray(card.items)) {
      card.items.forEach((item, itemIndex) => {
        requireText(`week.cards[${index}].items[${itemIndex}].label`, item.label, { max: 24 });
        requireText(`week.cards[${index}].items[${itemIndex}].text`, item.text, { max: 140 });
      });
    }
  });
}

requireText("feature.kicker", issue.feature?.kicker, { max: 40 });
requireText("feature.title", issue.feature?.title, { max: 110 });
requireText("feature.body", issue.feature?.body, { max: 260 });
noAdminCopy("feature.body", issue.feature?.body);
for (const [index, image] of (issue.feature?.images || []).entries()) {
  await checkAsset(`feature.images[${index}].src`, image.src);
  requireText(`feature.images[${index}].alt`, image.alt, { max: 120 });
}

requireText("businessUnits.title", issue.businessUnits?.title, { max: 90 });
requireText("businessUnits.lead", issue.businessUnits?.lead, { max: 90 });
requireText("businessUnits.note", issue.businessUnits?.note, { max: 180 });
await checkAsset("businessUnits.primaryImage.src", issue.businessUnits?.primaryImage?.src);
await checkAsset("businessUnits.supportingImage.src", issue.businessUnits?.supportingImage?.src);
if (!Array.isArray(issue.businessUnits?.notes) || issue.businessUnits.notes.length < 3) {
  failures.push("businessUnits.notes should contain at least 3 notes.");
} else {
  for (const [index, note] of issue.businessUnits.notes.entries()) {
    requireText(`businessUnits.notes[${index}].unit`, note.unit, { max: 40 });
    requireText(`businessUnits.notes[${index}].text`, note.text, { max: 120 });
    noAdminCopy(`businessUnits.notes[${index}].text`, note.text);
    await checkAsset(`businessUnits.notes[${index}].preview`, note.preview);
  }
}

requireText("lessons.title", issue.lessons?.title, { max: 90 });
requireText("lessons.body", issue.lessons?.body, { max: 260 });
requireText("lessons.credit", issue.lessons?.credit, { max: 80 });
noAdminCopy("lessons.body", issue.lessons?.body);
await checkAsset("lessons.image.src", issue.lessons?.image?.src);

requireText("sharing.title", issue.sharing?.title, { max: 90 });
requireText("sharing.body", issue.sharing?.body, { max: 180 });
noAdminCopy("sharing.body", issue.sharing?.body);
if (!Array.isArray(issue.sharing?.posts) || issue.sharing.posts.length < 1) {
  failures.push("sharing.posts should contain at least 1 post.");
} else {
  for (const [index, post] of issue.sharing.posts.entries()) {
    requireText(`sharing.posts[${index}].source`, post.source, { max: 70 });
    requireText(`sharing.posts[${index}].unit`, post.unit, { max: 40 });
    requireText(`sharing.posts[${index}].title`, post.title, { max: 120 });
    requireText(`sharing.posts[${index}].caption`, post.caption, { max: 40 });
    await checkAsset(`sharing.posts[${index}].image`, post.image);
    noAdminCopy(`sharing.posts[${index}].title`, post.title);
  }
}

await checkAsset("footer.mascot.src", issue.footer?.mascot?.src);

if (warnings.length) {
  console.warn(warnings.map((warning) => `Warning: ${warning}`).join("\n"));
}

if (failures.length) {
  console.error(failures.map((failure) => `Error: ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Issue ${issueSlug} passed validation${warnings.length ? ` with ${warnings.length} warning(s)` : ""}.`);
