import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createCaptionTracksFromManifest } from "../src/audible/captions.js";

test("generates French SRT and VTT when segment durations are present", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ubikia-captions-"));
  // Two paragraphs each filling the max character budget so the segmenter
  // emits exactly two segments matching the two timed manifest files.
  const spoken = [
    "Premier paragraphe de l’essai avec une formulation stable pour le test.",
    "",
    "Deuxième paragraphe avec une formulation centrale pour le second segment.",
  ].join("\n");

  await writeFile(path.join(directory, "spoken.reviewed.md"), `${spoken}\n`, "utf8");
  await writeFile(path.join(directory, "manifest.json"), `${JSON.stringify({
    schema: "ubikia.audible-manifest.v0.4",
    max_characters: 90,
    files: [
      {
        sequence: 1,
        filename: "segment-001.wav",
        duration_seconds: 2.5,
      },
      {
        sequence: 2,
        filename: "segment-002.wav",
        duration_seconds: 3.25,
      },
    ],
  }, null, 2)}\n`, "utf8");

  const result = await createCaptionTracksFromManifest({
    outputDirectory: directory,
    language: "fr",
  });

  assert.equal(result.status, "generated", result.reason ?? "");
  assert.equal(result.cue_count, 2);

  const srt = await readFile(path.join(directory, "captions.fr.srt"), "utf8");
  const vtt = await readFile(path.join(directory, "captions.fr.vtt"), "utf8");
  assert.match(srt, /00:00:00,000 --> 00:00:02,500/);
  assert.match(srt, /Premier paragraphe/);
  assert.match(vtt, /^WEBVTT/m);
  assert.match(vtt, /00:00:02\.500 --> 00:00:05\.750/);
});

test("reports unavailability when segment timings are missing", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ubikia-captions-missing-"));
  await writeFile(path.join(directory, "spoken.reviewed.md"), "Texte.\n", "utf8");
  await writeFile(path.join(directory, "manifest.json"), `${JSON.stringify({
    files: [{ sequence: 1, filename: "segment-001.wav" }],
  }, null, 2)}\n`, "utf8");

  const result = await createCaptionTracksFromManifest({
    outputDirectory: directory,
  });

  assert.equal(result.status, "unavailable");
  assert.match(result.reason, /duration_seconds/);
  assert.equal(result.captions, null);
});
