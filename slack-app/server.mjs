import crypto from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const PORT = Number(process.env.PORT || process.env.SUMMIT_DIGEST_SLACK_PORT || 8787);
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || "";
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
const ENABLE_DEPLOY = process.env.SUMMIT_DIGEST_ENABLE_DEPLOY === "true";
const PUBLIC_BASE_URL =
  process.env.SUMMIT_DIGEST_PUBLIC_BASE_URL || "https://summit-house-digest-prototype.netlify.app";
const DEFAULT_PREVIOUS_ISSUE_SLUG = process.env.SUMMIT_DIGEST_PREVIOUS_ISSUE || "2026-05-25-audrey-a";
const DEFAULT_SHARE_CHANNEL = process.env.SUMMIT_DIGEST_SHARE_CHANNEL || "";
const SLACK_CONTEXT_LOOKBACK_DAYS = Number(process.env.SUMMIT_DIGEST_CONTEXT_LOOKBACK_DAYS || 7);

const sectionOrder = ["this_week", "feature", "business_units", "lessons", "sharing"];

const sectionLabels = {
  this_week: "This Week",
  feature: "Staff Feature",
  business_units: "Business Units",
  lessons: "Lessons Learned",
  sharing: "What We're Sharing"
};

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, "utf8"));
const writeJson = async (filePath, value) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const issuePath = (weekSlug) => path.join(projectRoot, "issues", weekSlug, "issue.json");
const contextDir = (weekSlug) => path.join(projectRoot, "context", weekSlug);
const sessionPath = (weekSlug) => path.join(contextDir(weekSlug), "slack-session.json");
const candidatesPath = (weekSlug) => path.join(contextDir(weekSlug), "candidates.json");
const approvalsPath = (weekSlug) => path.join(contextDir(weekSlug), "approvals.json");
const rawDir = (weekSlug) => path.join(contextDir(weekSlug), "raw");

const runNodeScript = async (script, args = []) => {
  const result = await execFileAsync("node", [path.join(projectRoot, "scripts", script), ...args], {
    cwd: projectRoot,
    maxBuffer: 1024 * 1024 * 8
  });
  return [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
};

const runCommand = async (command, args = []) => {
  const result = await execFileAsync(command, args, {
    cwd: projectRoot,
    maxBuffer: 1024 * 1024 * 16
  });
  return [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
};

const parseFormBody = (body) => Object.fromEntries(new URLSearchParams(body));

export const parseCommandText = (text = "") => {
  const parsed = { command: "new", notes: "" };
  let remainder = text;

  for (const match of text.matchAll(/([\w-]+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g)) {
    const [, rawKey, doubleQuoted, singleQuoted, bare] = match;
    parsed[rawKey.replaceAll("-", "_")] = doubleQuoted ?? singleQuoted ?? bare ?? "";
    remainder = remainder.replace(match[0], " ");
  }

  const tokens = remainder.match(/"[^"]+"|'[^']+'|\S+/g) || [];
  const notes = tokens
    .map((token) => token.replace(/^["']|["']$/g, ""))
    .filter((token) => {
      if (["new", "new-digest", "digest"].includes(token) && !parsed.commandSeen) {
        parsed.commandSeen = true;
        return false;
      }
      return true;
    });

  parsed.notes = parsed.notes || notes.join(" ").trim();
  delete parsed.commandSeen;
  return parsed;
};

const nextMondaySlug = (now = new Date()) => {
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day = date.getUTCDay();
  const delta = day === 1 ? 7 : (8 - day) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
};

const findPreviousIssueSlug = async () => {
  try {
    await fs.access(issuePath(DEFAULT_PREVIOUS_ISSUE_SLUG));
    return DEFAULT_PREVIOUS_ISSUE_SLUG;
  } catch {
    const entries = await fs.readdir(path.join(projectRoot, "issues"), { withFileTypes: true });
    const issueSlugs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    return issueSlugs.at(-1) || "2026-05-25-audrey-a";
  }
};

export const slackSignature = (rawBody, timestamp, signingSecret = SLACK_SIGNING_SECRET) => {
  const base = `v0:${timestamp}:${rawBody}`;
  return `v0=${crypto.createHmac("sha256", signingSecret).update(base).digest("hex")}`;
};

export const verifySlackRequest = (headers, rawBody, signingSecret = SLACK_SIGNING_SECRET) => {
  if (!signingSecret) return true;
  const timestamp = headers["x-slack-request-timestamp"];
  const signature = headers["x-slack-signature"];
  if (!timestamp || !signature) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 60 * 5) return false;

  const digest = slackSignature(rawBody, timestamp, signingSecret);
  if (Buffer.byteLength(digest) !== Buffer.byteLength(signature)) return false;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
};

const readBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
};

const slackApi = async (method, payload) => {
  if (!SLACK_BOT_TOKEN) throw new Error("SLACK_BOT_TOKEN is not configured.");
  const response = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(payload)
  });
  const json = await response.json();
  if (!json.ok) throw new Error(`${method} failed: ${json.error || "unknown_error"}`);
  return json;
};

const postSlackResponse = async (responseUrl, payload) => {
  if (!responseUrl) return;
  await fetch(responseUrl, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
};

const postChannelMessage = async (channel, payload) => {
  if (!channel) return;
  await slackApi("chat.postMessage", { channel, ...payload });
};

const runAsync = (work, onError) => {
  Promise.resolve()
    .then(work)
    .catch(async (error) => {
      console.error(error);
      if (onError) await onError(error);
    });
};

const collectSlackContext = async ({ channelId, weekSlug }) => {
  const context = {
    source: "slack",
    channel_id: channelId,
    lookback_days: SLACK_CONTEXT_LOOKBACK_DAYS,
    messages: [],
    error: null
  };

  if (!SLACK_BOT_TOKEN || !channelId) {
    context.error = "Slack context skipped because SLACK_BOT_TOKEN or channel_id is missing.";
    return context;
  }

  try {
    const oldest = Math.floor(Date.now() / 1000 - SLACK_CONTEXT_LOOKBACK_DAYS * 24 * 60 * 60);
    const response = await slackApi("conversations.history", {
      channel: channelId,
      oldest,
      limit: 100,
      inclusive: true
    });
    context.messages = (response.messages || [])
      .filter((message) => message.text)
      .map((message) => ({
        user: message.user || message.username || "unknown",
        ts: message.ts,
        text: message.text
      }));
    await writeJson(path.join(rawDir(weekSlug), "slack-context.json"), context);
  } catch (error) {
    context.error = error.message;
  }

  return context;
};

const fallbackCandidates = (issue, weekSlug, context) => ({
  week_slug: weekSlug,
  generated_at: new Date().toISOString(),
  sources: [
    { type: "previous_issue", label: issue.slug || "previous issue", url_or_path: `issues/${issue.slug}/issue.json` },
    { type: "slack", label: "Slack channel context", url_or_path: context.channel_id || "" }
  ],
  candidates: {
    this_week: {
      summary: "Starter This Week deck carried forward from the previous approved issue.",
      items: issue.week.cards[0]?.items || []
    },
    feature: {
      summary: issue.feature.title,
      kicker: issue.feature.kicker,
      title: issue.feature.title,
      body: issue.feature.body,
      images: issue.feature.images
    },
    business_units: {
      summary: "Starter business unit notes carried forward from the previous approved issue.",
      notes: issue.businessUnits.notes
    },
    lessons: {
      summary: issue.lessons.title,
      title: issue.lessons.title,
      body: issue.lessons.body,
      credit: issue.lessons.credit,
      image: issue.lessons.image
    },
    sharing: {
      summary: "Starter sharing posts carried forward from the previous approved issue.",
      posts: issue.sharing.posts
    }
  }
});

const extractJsonObject = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Claude did not return a JSON object.");
  return JSON.parse(match[0]);
};

const generateCandidates = async ({ issue, weekSlug, command, slackContext }) => {
  if (!ANTHROPIC_API_KEY) return fallbackCandidates(issue, weekSlug, slackContext);

  const prompt = `You are Audrey's Summit House Digest publishing assistant.

Create concise reader-facing draft candidates for the next Summit House Digest.

Rules:
- Do not invent birthdays, OOO, events, staff facts, or sensitive internal details.
- If a fact needs Audrey confirmation, mark it needs_confirmation.
- Preserve the Design A structure: This Week has Birthdays, Events, Milestones, Watch.
- Keep copy editorial, sharp, and brief.
- Return JSON only.

Target week_slug: ${weekSlug}
Audrey notes from command: ${command.notes || "none"}
Slack context JSON: ${JSON.stringify(slackContext).slice(0, 12000)}
Previous issue JSON: ${JSON.stringify(issue).slice(0, 24000)}

Return this shape:
{
  "week_slug": "${weekSlug}",
  "generated_at": "ISO timestamp",
  "sources": [{"type":"slack|notes|previous_issue","label":"...","url_or_path":"..."}],
  "candidates": {
    "this_week": {"summary":"...","items":[{"label":"Birthdays","text":"..."},{"label":"Events","text":"..."},{"label":"Milestones","text":"..."},{"label":"Watch","text":"..."}]},
    "feature": {"summary":"...","kicker":"...","title":"...","body":"..."},
    "business_units": {"summary":"...","notes":[{"unit":"Summit House","text":"..."}]},
    "lessons": {"summary":"...","title":"...","body":"...","credit":"..."},
    "sharing": {"summary":"...","posts":[{"source":"...","index":"01","unit":"...","title":"...","caption":"...","image":"assets/images/...","url":""}]}
  },
  "open_questions": [{"section":"...","question":"..."}]
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 3500,
      temperature: 0.4,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Anthropic request failed: ${response.status} ${detail}`);
  }

  const json = await response.json();
  const text = (json.content || []).map((part) => part.text || "").join("\n");
  const candidates = extractJsonObject(text);
  candidates.generated_at ||= new Date().toISOString();
  candidates.week_slug = weekSlug;
  return candidates;
};

const sectionSummary = (candidates, section) => {
  const value = candidates.candidates?.[section] || {};
  if (section === "this_week") {
    return (value.items || []).map((item) => `• *${item.label}:* ${item.text}`).join("\n") || value.summary || "No items yet.";
  }
  if (section === "business_units") {
    return (value.notes || []).map((item) => `• *${item.unit}:* ${item.text}`).join("\n") || value.summary || "No notes yet.";
  }
  if (section === "sharing") {
    return (value.posts || []).map((item) => `• *${item.source || item.unit}:* ${item.title}`).join("\n") || value.summary || "No posts yet.";
  }
  if (section === "feature") {
    return [`*${value.title || "Untitled"}*`, value.body || value.summary || ""].filter(Boolean).join("\n");
  }
  if (section === "lessons") {
    return [`*${value.title || "Untitled"}*`, value.body || value.summary || ""].filter(Boolean).join("\n");
  }
  return value.summary || "No draft yet.";
};

const sessionBlocks = ({ session, candidates, section }) => {
  const sectionLabel = sectionLabels[section];
  const sectionIndex = sectionOrder.indexOf(section) + 1;
  return [
    {
      type: "header",
      text: { type: "plain_text", text: `${sectionIndex}/${sectionOrder.length}: ${sectionLabel}`, emoji: false }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: sectionSummary(candidates, section).slice(0, 2800)
      }
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Issue \`${session.weekSlug}\` from \`${session.previousSlug}\`. Choose what Audrey wants to do with this section.`
        }
      ]
    },
    {
      type: "actions",
      elements: [
        button("digest_keep_section", "Keep", "primary", { weekSlug: session.weekSlug, section }),
        button("digest_edit_section", "Edit", null, { weekSlug: session.weekSlug, section }),
        button("digest_replace_section", "Replace", null, { weekSlug: session.weekSlug, section }),
        button("digest_skip_section", "Skip", "danger", { weekSlug: session.weekSlug, section })
      ]
    }
  ];
};

const previewBlocks = (session, output = "") => [
  {
    type: "header",
    text: { type: "plain_text", text: "Digest preview is ready", emoji: false }
  },
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `Preview URL:\n${session.previewUrl}\n\nProduction target:\n${PUBLIC_BASE_URL}/digest/${session.weekSlug}/`
    }
  },
  ...(output
    ? [
        {
          type: "context",
          elements: [{ type: "mrkdwn", text: `QA: ${output.slice(0, 240)}` }]
        }
      ]
    : []),
  {
    type: "actions",
    elements: [
      button("digest_approve_publish", "Approve Publish", "primary", { weekSlug: session.weekSlug }),
      button("digest_request_changes", "Request Changes", null, { weekSlug: session.weekSlug })
    ]
  }
];

const button = (actionId, text, style, value) => ({
  type: "button",
  action_id: actionId,
  text: { type: "plain_text", text, emoji: false },
  ...(style ? { style } : {}),
  value: JSON.stringify(value)
});

const loadSession = async (weekSlug) => readJson(sessionPath(weekSlug));
const saveSession = async (session) => writeJson(sessionPath(session.weekSlug), session);

const initializeIssue = async ({ weekSlug, previousSlug }) => {
  await runNodeScript("init-wizard-context.mjs", [weekSlug]);
  try {
    await fs.access(issuePath(weekSlug));
  } catch {
    await runNodeScript("create-issue.mjs", [weekSlug, previousSlug]);
  }
};

const startDigest = async (form) => {
  const command = parseCommandText(form.text || "");
  const weekSlug = command.week || command.slug || nextMondaySlug();
  const previousSlug = command.previous || command.prev || (await findPreviousIssueSlug());

  await initializeIssue({ weekSlug, previousSlug });

  const issue = await readJson(issuePath(weekSlug));
  const slackContext = await collectSlackContext({ channelId: form.channel_id, weekSlug });
  const candidates = await generateCandidates({ issue, weekSlug, command, slackContext });
  await writeJson(candidatesPath(weekSlug), candidates);

  const session = {
    weekSlug,
    previousSlug,
    channelId: form.channel_id,
    userId: form.user_id,
    responseUrl: form.response_url,
    createdAt: new Date().toISOString(),
    status: "collecting_approvals",
    currentSection: sectionOrder[0],
    decisions: {},
    deployEnabled: ENABLE_DEPLOY,
    previewUrl: `http://localhost:4173/digest/${weekSlug}/`,
    productionUrl: `${PUBLIC_BASE_URL}/digest/${weekSlug}/`
  };
  await saveSession(session);

  await writeJson(approvalsPath(weekSlug), {
    week_slug: weekSlug,
    approved_for_preview: false,
    approved_for_deploy: false,
    decisions: [],
    open_questions: candidates.open_questions || []
  });

  return {
    response_type: "ephemeral",
    text: `Started Summit House Digest ${weekSlug}.`,
    blocks: sessionBlocks({ session, candidates, section: session.currentSection })
  };
};

const updateApprovalFile = async (session) => {
  const decisions = Object.entries(session.decisions).map(([section, decision]) => ({
    section,
    decision: decision.decision,
    final_copy: decision.final_copy || "",
    notes: decision.notes || "",
    decided_at: decision.decided_at
  }));
  const approvals = {
    week_slug: session.weekSlug,
    approved_for_preview: session.status === "preview_ready" || session.status === "published",
    approved_for_deploy: session.status === "published",
    decisions,
    open_questions: []
  };
  await writeJson(approvalsPath(session.weekSlug), approvals);
};

const updateCandidatesSection = async ({ weekSlug, section, replacementText }) => {
  const candidates = await readJson(candidatesPath(weekSlug));
  const current = candidates.candidates?.[section] || {};
  current.summary = replacementText;
  current.editor_override = replacementText;

  if (section === "feature") current.body = replacementText;
  if (section === "lessons") current.body = replacementText;
  if (section === "this_week") {
    current.items = current.items?.length
      ? current.items.map((item, index) => (index === 0 ? { ...item, text: replacementText } : item))
      : [{ label: "Watch", text: replacementText }];
  }
  if (section === "business_units") {
    current.notes = current.notes?.length
      ? current.notes.map((item, index) => (index === 0 ? { ...item, text: replacementText } : item))
      : [{ unit: "Summit House", text: replacementText }];
  }
  if (section === "sharing") {
    current.posts = current.posts?.length
      ? current.posts.map((item, index) => (index === 0 ? { ...item, title: replacementText } : item))
      : [{ source: "Summit House / LinkedIn", index: "01", unit: "Summit House", title: replacementText, caption: "House signal", image: "assets/images/generated/cat-paper-sighting.png" }];
  }

  candidates.candidates[section] = current;
  await writeJson(candidatesPath(weekSlug), candidates);
  return candidates;
};

const applyCandidatesToIssue = async (weekSlug) => {
  const issue = await readJson(issuePath(weekSlug));
  const candidates = await readJson(candidatesPath(weekSlug));
  const data = candidates.candidates || {};

  issue.slug = weekSlug;
  issue.layoutVariant = issue.layoutVariant || "audrey-a";

  if (data.this_week?.items?.length && issue.week?.cards?.[0]) {
    issue.week.cards[0].items = data.this_week.items.slice(0, 4).map((item) => ({
      label: item.label,
      text: item.text
    }));
  }

  if (data.feature) {
    if (data.feature.kicker) issue.feature.kicker = data.feature.kicker;
    if (data.feature.title) issue.feature.title = data.feature.title;
    if (data.feature.body) issue.feature.body = data.feature.body;
  }

  if (data.business_units?.notes?.length) {
    issue.businessUnits.notes = data.business_units.notes.map((note, index) => ({
      unit: note.unit,
      text: note.text,
      preview: note.preview || issue.businessUnits.notes[index]?.preview || "assets/images/generated/signal-summit-house.png",
      ...(index === 0 ? { featured: true } : {})
    }));
  }

  if (data.lessons) {
    if (data.lessons.title) issue.lessons.title = data.lessons.title;
    if (data.lessons.body) issue.lessons.body = data.lessons.body;
    if (data.lessons.credit) issue.lessons.credit = data.lessons.credit;
    if (data.lessons.image?.src) issue.lessons.image = data.lessons.image;
  }

  if (data.sharing?.posts?.length) {
    issue.sharing.posts = data.sharing.posts.map((post, index) => ({
      source: post.source || `${post.unit || "Summit House"} / LinkedIn`,
      index: post.index || String(index + 1).padStart(2, "0"),
      unit: post.unit || "Summit House",
      title: post.title,
      caption: post.caption || "Post capture",
      image: post.image || "assets/images/generated/cat-paper-sighting.png",
      alt: post.alt || `LinkedIn post visual placeholder for ${post.unit || "Summit House"}`,
      ...(post.url ? { url: post.url } : {})
    }));
  }

  await writeJson(issuePath(weekSlug), issue);
};

const renderAndQa = async (session) => {
  await applyCandidatesToIssue(session.weekSlug);
  const outputs = [];
  outputs.push(await runNodeScript("validate-issue.mjs", [session.weekSlug]));
  outputs.push(await runNodeScript("render-issue.mjs", [session.weekSlug]));
  outputs.push(await runNodeScript("publish-issue.mjs", [session.weekSlug]));
  outputs.push(await runNodeScript("qa-issue.mjs", [session.weekSlug]));
  session.status = "preview_ready";
  session.previewUrl = `http://localhost:4173/digest/${session.weekSlug}/`;
  session.productionUrl = `${PUBLIC_BASE_URL}/digest/${session.weekSlug}/`;
  await saveSession(session);
  await updateApprovalFile(session);
  return outputs.filter(Boolean).join("\n");
};

const deployIssue = async (session) => {
  if (!ENABLE_DEPLOY) {
    session.status = "deploy_approved_not_run";
    await saveSession(session);
    return {
      deployed: false,
      message: `Publish approved, but SUMMIT_DIGEST_ENABLE_DEPLOY is not true. Run manually:\n\`npx -y netlify-cli@latest deploy --prod --dir .\``
    };
  }

  const output = await runCommand("npx", ["-y", "netlify-cli@latest", "deploy", "--prod", "--dir", "."]);
  const urlMatch = output.match(/https:\/\/[^\s]+/g);
  session.status = "published";
  session.productionUrl = urlMatch?.at(-1) || `${PUBLIC_BASE_URL}/digest/${session.weekSlug}/`;
  await saveSession(session);
  await updateApprovalFile(session);
  return { deployed: true, message: output, productionUrl: session.productionUrl };
};

const nextSection = (currentSection) => sectionOrder[sectionOrder.indexOf(currentSection) + 1];

const handleSectionDecision = async ({ actionId, value, payload }) => {
  const session = await loadSession(value.weekSlug);
  const candidates = await readJson(candidatesPath(value.weekSlug));
  const decision = actionId.replace("digest_", "").replace("_section", "");

  if (decision === "edit" || decision === "replace") {
    await slackApi("views.open", {
      trigger_id: payload.trigger_id,
      view: editModal({ weekSlug: value.weekSlug, section: value.section, mode: decision, candidates })
    });
    return { response_action: "clear" };
  }

  session.decisions[value.section] = {
    decision,
    decided_at: new Date().toISOString(),
    final_copy: sectionSummary(candidates, value.section)
  };

  const following = nextSection(value.section);
  if (following) {
    session.currentSection = following;
    await saveSession(session);
    await updateApprovalFile(session);
    return {
      replace_original: true,
      text: `Saved ${sectionLabels[value.section]}.`,
      blocks: sessionBlocks({ session, candidates, section: following })
    };
  }

  runAsync(
    async () => {
      const qaOutput = await renderAndQa(session);
      await postSlackResponse(payload.response_url, {
        replace_original: true,
        text: `Preview is ready for ${session.weekSlug}.`,
        blocks: previewBlocks(session, qaOutput)
      });
    },
    async (error) => {
      await postSlackResponse(payload.response_url, {
        replace_original: false,
        text: `Preview failed for ${session.weekSlug}: ${error.message}`
      });
    }
  );

  return {
    replace_original: true,
    text: `Building preview for ${session.weekSlug}. I’ll post the QA result here when it is ready.`
  };
};

const editModal = ({ weekSlug, section, mode, candidates }) => ({
  type: "modal",
  callback_id: "digest_section_edit",
  private_metadata: JSON.stringify({ weekSlug, section, mode }),
  title: { type: "plain_text", text: `${mode === "replace" ? "Replace" : "Edit"} Section`, emoji: false },
  submit: { type: "plain_text", text: "Save", emoji: false },
  close: { type: "plain_text", text: "Cancel", emoji: false },
  blocks: [
    {
      type: "input",
      block_id: "section_text",
      label: { type: "plain_text", text: sectionLabels[section], emoji: false },
      element: {
        type: "plain_text_input",
        action_id: "value",
        multiline: true,
        initial_value: sectionSummary(candidates, section).replace(/\*/g, "").slice(0, 2900)
      }
    }
  ]
});

const handleModalSubmission = async (payload) => {
  const metadata = JSON.parse(payload.view.private_metadata);
  const replacementText = payload.view.state.values.section_text.value.value;
  const candidates = await updateCandidatesSection({
    weekSlug: metadata.weekSlug,
    section: metadata.section,
    replacementText
  });
  const session = await loadSession(metadata.weekSlug);
  session.decisions[metadata.section] = {
    decision: metadata.mode,
    decided_at: new Date().toISOString(),
    final_copy: replacementText
  };

  const following = nextSection(metadata.section);
  if (following) {
    session.currentSection = following;
    await saveSession(session);
    await updateApprovalFile(session);
    await postChannelMessage(session.channelId, {
      text: `Saved ${sectionLabels[metadata.section]}.`,
      blocks: sessionBlocks({ session, candidates, section: following })
    });
  } else {
    runAsync(
      async () => {
        const qaOutput = await renderAndQa(session);
        await postChannelMessage(session.channelId, {
          text: `Preview is ready for ${session.weekSlug}.`,
          blocks: previewBlocks(session, qaOutput)
        });
      },
      async (error) => {
        await postChannelMessage(session.channelId, {
          text: `Preview failed for ${session.weekSlug}: ${error.message}`
        });
      }
    );
  }
};

const handlePublishDecision = async ({ actionId, value }) => {
  const session = await loadSession(value.weekSlug);

  if (actionId === "digest_request_changes") {
    session.status = "changes_requested";
    await saveSession(session);
    return {
      replace_original: false,
      text: `Changes requested for ${session.weekSlug}. Use \`/new-digest week=${session.weekSlug} prev=${session.previousSlug}\` to regenerate or edit the issue JSON directly.`
    };
  }

  runAsync(
    async () => {
      const result = await deployIssue(session);
      const channel = DEFAULT_SHARE_CHANNEL || session.channelId;
      const finalText = result.deployed
        ? `Summit House Digest ${session.weekSlug} is published: ${session.productionUrl}`
        : `Summit House Digest ${session.weekSlug} is approved but not deployed automatically.\n${result.message}`;

      await postChannelMessage(channel, { text: finalText });
    },
    async (error) => {
      await postChannelMessage(DEFAULT_SHARE_CHANNEL || session.channelId, {
        text: `Publish failed for ${session.weekSlug}: ${error.message}`
      });
    }
  );

  return {
    replace_original: false,
    text: `Publish approval recorded for ${session.weekSlug}. I’ll post the final deploy status when it is done.`
  };
};

const handleInteraction = async (payload) => {
  if (payload.type === "view_submission" && payload.view?.callback_id === "digest_section_edit") {
    await handleModalSubmission(payload);
    return { response_action: "clear" };
  }

  const action = payload.actions?.[0];
  if (!action) return { text: "No action found." };
  const value = JSON.parse(action.value || "{}");

  if (action.action_id.startsWith("digest_") && action.action_id.endsWith("_section")) {
    return handleSectionDecision({ actionId: action.action_id, value, payload });
  }

  if (action.action_id === "digest_approve_publish" || action.action_id === "digest_request_changes") {
    return handlePublishDecision({ actionId: action.action_id, value, payload });
  }

  return { text: `Unknown action: ${action.action_id}` };
};

const writeResponse = (response, status, body, headers = jsonHeaders) => {
  response.writeHead(status, headers);
  response.end(typeof body === "string" ? body : JSON.stringify(body));
};

const handleRequest = async (request, response) => {
  const rawBody = await readBody(request);
  if (!verifySlackRequest(request.headers, rawBody)) {
    writeResponse(response, 401, { error: "invalid_slack_signature" });
    return;
  }

  const url = new URL(request.url || "/", `http://localhost:${PORT}`);

  try {
    if (request.method === "GET" && url.pathname === "/health") {
      writeResponse(response, 200, {
        ok: true,
        service: "summit-house-digest-slack-app",
        deploy_enabled: ENABLE_DEPLOY,
        claude_configured: Boolean(ANTHROPIC_API_KEY),
        slack_bot_configured: Boolean(SLACK_BOT_TOKEN)
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/slack/commands") {
      const form = parseFormBody(rawBody);
      writeResponse(response, 200, {
        response_type: "ephemeral",
        text: "Starting Summit House Digest wizard..."
      });
      startDigest(form)
        .then((payload) => postSlackResponse(form.response_url, payload))
        .catch((error) =>
          postSlackResponse(form.response_url, {
            response_type: "ephemeral",
            text: `Digest wizard failed: ${error.message}`
          })
        );
      return;
    }

    if (request.method === "POST" && url.pathname === "/slack/interactions") {
      const form = parseFormBody(rawBody);
      const payload = JSON.parse(form.payload || "{}");
      const result = await handleInteraction(payload);
      writeResponse(response, 200, result);
      return;
    }

    writeResponse(response, 404, { error: "not_found" });
  } catch (error) {
    writeResponse(response, 500, { error: error.message });
  }
};

export const createServer = () => http.createServer(handleRequest);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createServer().listen(PORT, () => {
    console.log(`Summit Digest Slack app listening on http://localhost:${PORT}`);
  });
}
