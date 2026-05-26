import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer, parseCommandText, slackSignature, verifySlackRequest } from "./server.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const weekSlug = "2099-02-03-slack-integration";

const rm = async (relativePath) => {
  await fs.rm(path.join(projectRoot, relativePath), { recursive: true, force: true });
};

const readJson = async (relativePath) => JSON.parse(await fs.readFile(path.join(projectRoot, relativePath), "utf8"));

const postForm = async (baseUrl, pathname, fields) => {
  const body = new URLSearchParams(fields);
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });
  return { response, text: await response.text() };
};

const waitFor = async (fn, { timeoutMs = 15000, intervalMs = 250 } = {}) => {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try {
      const value = await fn();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  if (lastError) throw lastError;
  throw new Error("Timed out waiting for condition.");
};

const signedBody = "text=hello";
const timestamp = Math.floor(Date.now() / 1000).toString();
const signature = slackSignature(signedBody, timestamp, "test-secret");
assert.equal(
  verifySlackRequest(
    {
      "x-slack-request-timestamp": timestamp,
      "x-slack-signature": signature
    },
    signedBody,
    "test-secret"
  ),
  true
);
assert.equal(
  verifySlackRequest(
    {
      "x-slack-request-timestamp": timestamp,
      "x-slack-signature": `${signature.slice(0, -1)}${signature.endsWith("0") ? "1" : "0"}`
    },
    signedBody,
    "test-secret"
  ),
  false
);

const parsed = parseCommandText('new week=2026-06-01 prev=2026-05-25-audrey-a notes="Lauren birthday, Oust review"');
assert.equal(parsed.week, "2026-06-01");
assert.equal(parsed.prev, "2026-05-25-audrey-a");
assert.equal(parsed.notes, "Lauren birthday, Oust review");

await rm(`context/${weekSlug}`);
await rm(`issues/${weekSlug}`);
await rm(`digest/${weekSlug}`);

const server = createServer();
await new Promise((resolve) => server.listen(0, resolve));
const { port } = server.address();
const baseUrl = `http://localhost:${port}`;

try {
  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);

  const command = await postForm(baseUrl, "/slack/commands", {
    text: `new week=${weekSlug} prev=2026-05-25-audrey-a notes="integration smoke"`,
    channel_id: "CLOCAL",
    user_id: "ULOCAL",
    response_url: ""
  });
  assert.equal(command.response.status, 200);
  assert.match(command.text, /Starting Summit House Digest wizard/);

  await waitFor(async () => {
    const session = await readJson(`context/${weekSlug}/slack-session.json`);
    return session.status === "collecting_approvals";
  });

  for (const section of ["this_week", "feature", "business_units", "lessons", "sharing"]) {
    const payload = {
      type: "block_actions",
      trigger_id: "TLOCAL",
      response_url: "",
      actions: [
        {
          action_id: "digest_keep_section",
          value: JSON.stringify({ weekSlug, section })
        }
      ]
    };
    const interaction = await postForm(baseUrl, "/slack/interactions", {
      payload: JSON.stringify(payload)
    });
    assert.equal(interaction.response.status, 200);
  }

  const session = await waitFor(async () => {
    const value = await readJson(`context/${weekSlug}/slack-session.json`);
    return value.status === "preview_ready" ? value : null;
  });

  const approvals = await readJson(`context/${weekSlug}/approvals.json`);
  const issue = await readJson(`issues/${weekSlug}/issue.json`);
  const digestHtml = await fs.readFile(path.join(projectRoot, "digest", weekSlug, "index.html"), "utf8");

  assert.equal(session.status, "preview_ready");
  assert.equal(approvals.approved_for_preview, true);
  assert.equal(approvals.approved_for_deploy, false);
  assert.equal(approvals.decisions.length, 5);
  assert.equal(issue.layoutVariant, "audrey-a");
  assert.match(digestHtml, /Summit House Digest/);
} finally {
  server.close();
  await rm(`context/${weekSlug}`);
  await rm(`issues/${weekSlug}`);
  await rm(`digest/${weekSlug}`);
}

console.log("Slack app integration test passed.");
