import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const issuesRoot = path.join(projectRoot, "issues");

const [nextSlug, previousSlug = "2026-05-25"] = process.argv.slice(2);

if (!nextSlug) {
  console.error("Usage: node scripts/create-issue.mjs <new-week-slug> [previous-week-slug]");
  process.exit(1);
}

const previousPath = path.join(issuesRoot, previousSlug, "issue.json");
const nextDir = path.join(issuesRoot, nextSlug);
const nextPath = path.join(nextDir, "issue.json");

try {
  await fs.access(nextPath);
  console.error(`Issue already exists: ${path.relative(projectRoot, nextPath)}`);
  process.exit(1);
} catch {
  // Expected for a new issue.
}

const issue = JSON.parse(await fs.readFile(previousPath, "utf8"));
issue.slug = nextSlug;
issue.issueNumber = String(Number(issue.issueNumber) + 1).padStart(2, "0");
issue.weekLabel = `Week of ${nextSlug}`;

await fs.mkdir(nextDir, { recursive: true });
await fs.writeFile(nextPath, `${JSON.stringify(issue, null, 2)}\n`);

console.log(`Created ${path.relative(projectRoot, nextPath)} from ${previousSlug}.`);
console.log("Update weekLabel, copy, stats, posts, and images before rendering.");
