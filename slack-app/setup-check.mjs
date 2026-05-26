import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const requiredFiles = [
  "slack-app/server.mjs",
  "slack-app/slack-manifest.yml",
  "slack-app/.env.example",
  "scripts/create-issue.mjs",
  "scripts/init-wizard-context.mjs",
  "scripts/validate-issue.mjs",
  "scripts/render-issue.mjs",
  "scripts/publish-issue.mjs",
  "scripts/qa-issue.mjs",
  "issues/2026-05-25-audrey-a/issue.json"
];

const checks = [];

const add = (status, label, detail = "") => checks.push({ status, label, detail });

const exists = async (relativePath) => {
  try {
    await fs.access(path.join(projectRoot, relativePath));
    return true;
  } catch {
    return false;
  }
};

const env = (name) => process.env[name] || "";

const nodeMajor = Number(process.versions.node.split(".")[0]);
add(nodeMajor >= 18 ? "pass" : "fail", "Node 18+ runtime", `current ${process.versions.node}`);

for (const file of requiredFiles) {
  add((await exists(file)) ? "pass" : "fail", `Required file: ${file}`);
}

add(env("SLACK_SIGNING_SECRET") ? "pass" : "warn", "SLACK_SIGNING_SECRET", "required for real Slack requests");
add(env("SLACK_BOT_TOKEN") ? "pass" : "warn", "SLACK_BOT_TOKEN", "required to post channel messages and collect context");
add(env("ANTHROPIC_API_KEY") ? "pass" : "warn", "ANTHROPIC_API_KEY", "optional, but required for Claude-drafted candidates");

const publicHost = env("SUMMIT_DIGEST_SLACK_PUBLIC_HOST");
add(
  /^https:\/\/[^/]+/.test(publicHost) ? "pass" : "warn",
  "SUMMIT_DIGEST_SLACK_PUBLIC_HOST",
  publicHost ? "must be an HTTPS origin" : "needed to render Slack manifest URLs"
);

const deployEnabled = env("SUMMIT_DIGEST_ENABLE_DEPLOY") === "true";
add(
  !deployEnabled || Boolean(env("NETLIFY_AUTH_TOKEN") || env("NETLIFY_SITE_ID") || (await exists(".netlify/state.json")))
    ? "pass"
    : "warn",
  "Netlify deploy readiness",
  deployEnabled
    ? "deploy enabled; confirm Netlify auth works in this runtime"
    : "deploy disabled; bot will post manual deploy instructions"
);

if (await exists("slack-app/slack-manifest.generated.yml")) {
  const generated = await fs.readFile(path.join(projectRoot, "slack-app/slack-manifest.generated.yml"), "utf8");
  add(!generated.includes("YOUR_PUBLIC_HOST") ? "pass" : "fail", "Generated Slack manifest URL replacement");
} else {
  add("warn", "Generated Slack manifest", "run npm run slack:manifest -- https://your-public-host");
}

if (env("SLACK_BOT_TOKEN")) {
  try {
    const response = await fetch("https://slack.com/api/auth.test", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env("SLACK_BOT_TOKEN")}`,
        "content-type": "application/json; charset=utf-8"
      },
      body: "{}"
    });
    const json = await response.json();
    add(json.ok ? "pass" : "fail", "Slack auth.test", json.ok ? `${json.team} / ${json.user}` : json.error);
  } catch (error) {
    add("fail", "Slack auth.test", error.message);
  }
}

const icon = { pass: "PASS", warn: "WARN", fail: "FAIL" };
for (const check of checks) {
  console.log(`${icon[check.status]} ${check.label}${check.detail ? ` - ${check.detail}` : ""}`);
}

const failures = checks.filter((check) => check.status === "fail");
const warnings = checks.filter((check) => check.status === "warn");

console.log(`\n${checks.length} checks: ${failures.length} fail, ${warnings.length} warn.`);

if (failures.length) process.exit(1);
