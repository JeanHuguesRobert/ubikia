import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateReferenceEpisode } from "../src/audible/validate-reference-episode.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectDirectory = path.join(
  repositoryRoot,
  "examples",
  "audible",
  "le-pere-noel-revient",
);

test("reference episode le-pere-noel-revient validates without TTS credentials", async () => {
  const result = await validateReferenceEpisode(projectDirectory);

  assert.equal(result.status, "valid", result.errors.join("\n"));
  assert.equal(result.episode_slug, "le-pere-noel-revient");
  assert.equal(result.source_commit, "f1e9057696f26b49e9e97a9bbaa67b59d5954f65");
  assert.equal(result.source_blob_sha, "3e66696cf534f16b4e8671fec26418c96c380fb5");
  assert.equal(result.human_gates?.spoken_script, "required");
  assert.equal(result.spoken_validation.human_review_required, true);
});
