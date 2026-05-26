import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const [issueSlug, sheetDir] = process.argv.slice(2);

if (!issueSlug || !sheetDir) {
  console.error("Usage: node scripts/import-sheet-export.mjs <week-slug> <sheet-export-dir>");
  process.exit(1);
}

const issuePath = path.join(projectRoot, "issues", issueSlug, "issue.json");
const exportRoot = path.resolve(process.cwd(), sheetDir);

const parseCsv = (source) => {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
};

const readRows = async (filename) => {
  const fullPath = path.join(exportRoot, filename);
  try {
    const text = await fs.readFile(fullPath, "utf8");
    const [headers = [], ...rows] = parseCsv(text);
    return rows.map((row) =>
      Object.fromEntries(headers.map((header, index) => [header.trim(), (row[index] || "").trim()]))
    );
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
};

const firstValueMap = (rows) =>
  Object.fromEntries(rows.filter((row) => row.field).map((row) => [row.field, row.value || ""]));

const numberOrString = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && String(value).trim() !== "" ? number : value;
};

const issue = JSON.parse(await fs.readFile(issuePath, "utf8"));

const issueRows = firstValueMap(await readRows("issue.csv"));
if (issueRows.slug) issue.slug = issueRows.slug;
if (issueRows.issueNumber) issue.issueNumber = issueRows.issueNumber.padStart(2, "0");
if (issueRows.weekLabel) issue.weekLabel = issueRows.weekLabel;
if (issueRows.mastheadHeadline) issue.masthead.headline = issueRows.mastheadHeadline;
if (issueRows.mastheadDek) issue.masthead.dek = issueRows.mastheadDek;

const weekRows = await readRows("this-week.csv");
if (weekRows.length) {
  const occasionCard = issue.week.cards.find((card) => card.variant === "occasions");
  if (issue.layoutVariant === "audrey-a" && occasionCard) {
    occasionCard.items = weekRows.map((row) => ({
      label: row.label,
      text: row.text
    }));
  } else {
    issue.week.cards = weekRows.map((row) => ({
      label: row.label,
      count: numberOrString(row.count),
      text: row.text,
      ...(row.variant ? { variant: row.variant } : {})
    }));
  }
}

const featureRows = firstValueMap(await readRows("lead-feature.csv"));
if (Object.keys(featureRows).length) {
  if (featureRows.kicker) issue.feature.kicker = featureRows.kicker;
  if (featureRows.title) issue.feature.title = featureRows.title;
  if (featureRows.body) issue.feature.body = featureRows.body;
  issue.feature.images = issue.feature.images.map((image, index) => ({
    ...image,
    src: featureRows[`image_${index + 1}`] || image.src
  }));
}

const businessRows = await readRows("business-units.csv");
if (businessRows.length) {
  issue.businessUnits.notes = businessRows.map((row) => ({
    unit: row.unit,
    text: row.text,
    preview: row.preview || "assets/images/generated/signal-summit-house.png"
  }));
}

const lessonRows = firstValueMap(await readRows("lessons.csv"));
if (Object.keys(lessonRows).length) {
  if (lessonRows.title) issue.lessons.title = lessonRows.title;
  if (lessonRows.body) issue.lessons.body = lessonRows.body;
  if (lessonRows.image) issue.lessons.image.src = lessonRows.image;
  if (lessonRows.credit) issue.lessons.credit = lessonRows.credit;
}

const sharingRows = await readRows("sharing.csv");
if (sharingRows.length) {
  issue.sharing.posts = sharingRows.map((row) => ({
    source: row.source,
    index: row.index,
    unit: row.unit,
    title: row.title,
    caption: row.caption || "Post capture",
    image: row.image,
    alt: row.alt || `LinkedIn post visual placeholder for ${row.unit}`,
    ...(row.url ? { url: row.url } : {})
  }));
}

await fs.writeFile(issuePath, `${JSON.stringify(issue, null, 2)}\n`);
console.log(`Imported sheet export into ${path.relative(projectRoot, issuePath)}.`);
