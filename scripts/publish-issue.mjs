import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readIssue, renderIssueDocument } from "./render-issue.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const issueSlug = process.argv[2] || "2026-05-25";
const templatePath = path.join(projectRoot, "index.html");
const outputDir = path.join(projectRoot, "digest", issueSlug);
const outputPath = path.join(outputDir, "index.html");

const issue = await readIssue(issueSlug);
const template = await fs.readFile(templatePath, "utf8");
const html = renderIssueDocument(template, issue, { baseHref: "../../" });

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(outputPath, html);

console.log(`Published ${issueSlug} to ${path.relative(projectRoot, outputPath)}.`);
console.log(`Preview URL: http://localhost:4173/digest/${issueSlug}/`);
