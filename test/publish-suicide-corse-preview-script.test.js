import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const script = path.join(root, "scripts/publish-suicide-corse-preview.sh");
const bash = process.platform === "win32"
  ? "C:\\Program Files\\Git\\usr\\bin\\bash.exe"
  : "bash";

test("Suicide Corse preview procedure is syntactically valid and explicit about its gates", async () => {
  const syntax = spawnSync(bash, ["-n", script], { encoding: "utf8" });
  assert.equal(syntax.status, 0, syntax.stderr);

  const source = await readFile(script, "utf8");
  assert.match(source, /set -euo pipefail/);
  assert.match(source, /--dry-run/);
  assert.match(source, /--push requires --commit/);
  assert.match(source, /--commit requires --apply/);
  assert.match(source, /publication_status !== 'draft'/);
  assert.match(source, /const required = \['html', 'pdf', 'epub'\]/);
  assert.match(source, /Validated rendered EPUB/);
  assert.match(source, /render-suicide-corse-open-questions\.mjs/);
  assert.match(source, /Validated open questions projection/);
  assert.match(source, /questions-ouvertes\.html/);
  assert.match(source, /git -C "\$SUICIDE_CORSE_SITE_DIR" -c core\.whitespace=-blank-at-eol diff --check/);
  assert.match(source, /cp -a -- "\$build_dir\/_book\/\." "\$stage_dir\//);
  assert.match(source, /git -C "\$SUICIDE_CORSE_SITE_DIR" add -- "editions\/\$RELEASE_ID"/);
});
