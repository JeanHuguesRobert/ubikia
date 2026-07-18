import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { prepareFinalizedAdaptationWorkspace } from "../src/audible/finalize-workspace.js";
import {
  detectFinalizePathAliasing,
  isPathInsideOrEqual,
  requireStagedFinalizeInputs,
} from "../src/audible/path-safety.js";

test("detects when source or spoken inputs resolve inside the output directory", () => {
  const output = path.resolve("/tmp/ubikia-episode");
  const spokenInside = path.join(output, "spoken.draft.md");
  const sourceOutside = path.resolve("/tmp/source.md");

  const aliasing = detectFinalizePathAliasing({
    sourceFile: sourceOutside,
    spokenFile: spokenInside,
    outputDirectory: output,
  });

  assert.equal(aliasing.spoken_inside_output, true);
  assert.equal(aliasing.source_inside_output, false);
  assert.equal(isPathInsideOrEqual(spokenInside, output), true);

  const staging = requireStagedFinalizeInputs(aliasing);
  assert.equal(staging.must_stage_spoken, true);
  assert.equal(staging.aliasing_detected, true);
});

test("preserves an approved spoken script when it lives inside the finalize output workspace", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ubikia-finalize-alias-"));
  const sourcePath = path.join(directory, "source.md");
  const spokenPath = path.join(directory, "spoken.draft.md");

  const sourceText = `---
title: "Test"
date: "2026-07-18"
---

Le Père Noël revient avec 3 lutins et une phrase claire.
`;
  const approvedSpoken = "Le Père Noël revient avec 3 lutins et une phrase claire.\n";

  await writeFile(sourcePath, sourceText, "utf8");
  await writeFile(spokenPath, approvedSpoken, "utf8");

  const prepared = await prepareFinalizedAdaptationWorkspace({
    sourceText: await readFile(sourcePath, "utf8"),
    spokenText: await readFile(spokenPath, "utf8"),
    sourceFile: sourcePath,
    spokenFile: spokenPath,
    outputDirectory: directory,
    reviewer: "Test Reviewer",
    notes: "Regression test for finalize path aliasing.",
    metadata: {
      title: "Test episode",
      language: "fr",
    },
  });

  const draft = await readFile(path.join(directory, "spoken.draft.md"), "utf8");
  const reviewed = await readFile(path.join(directory, "spoken.reviewed.md"), "utf8");
  const adaptation = JSON.parse(await readFile(path.join(directory, "adaptation.json"), "utf8"));

  assert.equal(prepared.aliasing.spoken_inside_output, true);
  assert.equal(prepared.aliasing.source_inside_output, true);
  assert.equal(prepared.staging.must_stage_spoken, true);
  assert.match(draft, /3 lutins/);
  assert.match(reviewed, /3 lutins/);
  assert.equal(adaptation.status, "reviewed");
  assert.equal(adaptation.path_aliasing.spoken_inside_output, true);
  assert.equal(reviewed.trim(), approvedSpoken.trim());
});

test("stages spoken content from memory even when a stale draft already exists in the workspace", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ubikia-finalize-stage-"));
  const sourceOutside = path.join(directory, "outside-source.md");
  const outputDirectory = path.join(directory, "workspace");
  const spokenInside = path.join(outputDirectory, "spoken.draft.md");

  const sourceText = "Source body with token 42 and a short thesis.\n";
  const approvedSpoken = "Approved spoken body with token 42 and a short thesis.\n";

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(sourceOutside, sourceText, "utf8");
  await writeFile(spokenInside, "STALE WORKSPACE DRAFT\n", "utf8");

  const prepared = await prepareFinalizedAdaptationWorkspace({
    sourceText,
    spokenText: approvedSpoken,
    sourceFile: sourceOutside,
    spokenFile: spokenInside,
    outputDirectory,
    reviewer: "Test Reviewer",
  });

  const reviewed = await readFile(prepared.reviewedFile, "utf8");
  assert.equal(reviewed.trim(), approvedSpoken.trim());
  assert.match(reviewed, /Approved spoken body/);
  assert.doesNotMatch(reviewed, /STALE WORKSPACE DRAFT/);
});
