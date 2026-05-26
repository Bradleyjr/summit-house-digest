import assert from "node:assert/strict";
import { parseCommandText } from "./server.mjs";

const parsed = parseCommandText("new week=2026-06-01 prev=2026-05-25-audrey-a notes='Lauren birthday, Oust review'");

assert.equal(parsed.command, "new");
assert.equal(parsed.week, "2026-06-01");
assert.equal(parsed.prev, "2026-05-25-audrey-a");
assert.match(parsed.notes, /Lauren birthday/);

console.log("Slack app smoke test passed.");

