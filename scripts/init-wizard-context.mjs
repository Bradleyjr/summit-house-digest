import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const [weekSlug] = process.argv.slice(2);

if (!weekSlug) {
  console.error("Usage: node scripts/init-wizard-context.mjs <week-slug>");
  process.exit(1);
}

const contextDir = path.join(projectRoot, "context", weekSlug);
const rawDir = path.join(contextDir, "raw");

await fs.mkdir(rawDir, { recursive: true });

const writeIfMissing = async (filePath, value) => {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, value);
  }
};

await writeIfMissing(
  path.join(contextDir, "candidates.json"),
  `${JSON.stringify(
    {
      week_slug: weekSlug,
      generated_at: new Date().toISOString(),
      sources: [],
      candidates: []
    },
    null,
    2
  )}\n`
);

await writeIfMissing(
  path.join(contextDir, "approvals.json"),
  `${JSON.stringify(
    {
      week_slug: weekSlug,
      approved_for_preview: false,
      approved_for_deploy: false,
      decisions: [],
      open_questions: []
    },
    null,
    2
  )}\n`
);

await writeIfMissing(
  path.join(contextDir, "digest-brief.md"),
  `# Summit House Digest Brief: ${weekSlug}

## Source Notes

## Recommended Shape

## This Week

## Staff Feature

## Business Units

## Lesson Learned

## Sharing

## Open Questions
`
);

console.log(`Initialized ${path.relative(projectRoot, contextDir)}.`);
