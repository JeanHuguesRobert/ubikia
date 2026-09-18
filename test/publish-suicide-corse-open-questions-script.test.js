import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const script = path.join(root, "scripts/publish-suicide-corse-open-questions.sh");
const bash = process.platform === "win32" ? "C:\\Program Files\\Git\\usr\\bin\\bash.exe" : "bash";

test("open questions publisher is independent from the frozen edition", async () => {
  const syntax = spawnSync(bash, ["-n", script], { encoding: "utf8" });
  assert.equal(syntax.status, 0, syntax.stderr);
  const source = await readFile(script, "utf8");
  assert.match(source, /questions-ouvertes\.md/);
  assert.match(source, /render-suicide-corse-open-questions\.mjs/);
  assert.match(source, /--push requires --commit/);
  assert.match(source, /data-source-commit/);
  assert.doesNotMatch(source, /editions\/2026-09-17/);
});
