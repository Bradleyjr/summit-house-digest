import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(__dirname, "slack-manifest.yml");
const outputPath = path.join(__dirname, "slack-manifest.generated.yml");

const publicHost = process.argv[2] || process.env.SUMMIT_DIGEST_SLACK_PUBLIC_HOST || "";

if (!publicHost || !/^https:\/\/[^/]+/.test(publicHost)) {
  console.error("Usage: node slack-app/render-manifest.mjs https://your-public-host.example");
  console.error("Or set SUMMIT_DIGEST_SLACK_PUBLIC_HOST=https://your-public-host.example");
  process.exit(1);
}

const normalizedHost = publicHost.replace(/\/+$/, "");
const template = await fs.readFile(templatePath, "utf8");
const rendered = template.replaceAll("https://YOUR_PUBLIC_HOST", normalizedHost);

await fs.writeFile(outputPath, rendered);

console.log(`Rendered ${path.relative(process.cwd(), outputPath)}`);
console.log(`Slash command URL: ${normalizedHost}/slack/commands`);
console.log(`Interactivity URL: ${normalizedHost}/slack/interactions`);

