import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  extractYouTubeVideoId,
  recordYouTubePublication,
} from "../src/audible/record-publication.js";

test("extracts video ids from supported YouTube URLs", () => {
  assert.equal(extractYouTubeVideoId("https://youtu.be/mjdHmPvNmB0"), "mjdHmPvNmB0");
  assert.equal(
    extractYouTubeVideoId("https://www.youtube.com/watch?v=mjdHmPvNmB0"),
    "mjdHmPvNmB0",
  );
});

test("records a human-confirmed YouTube publication in package and manifest", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ubikia-youtube-publication-"));
  await writeJson(path.join(directory, "manifest.json"), {
    schema: "ubikia.audible-manifest.v0.4",
    source_sha256: "source-sha",
    spoken_text_sha256: "spoken-sha",
    publication_assets: {
      youtube_video: {
        filename: "episode.youtube.mp4",
        sha256: "video-sha",
      },
    },
  });
  await writeJson(path.join(directory, "youtube-package.json"), {
    schema: "ubikia.youtube-publication-package.v0.1",
    status: "draft",
    upload_status: "not_uploaded",
    target: "youtube",
    title: "Episode",
    transcript: {
      filename: "spoken.reviewed.md",
      review_status: "reviewed",
    },
    video: {
      filename: "episode.youtube.mp4",
      sha256: "video-sha",
    },
    provenance: {
      source_sha256: "source-sha",
      spoken_text_sha256: "spoken-sha",
    },
    publication_result: null,
  });

  const result = await recordYouTubePublication({
    outputDirectory: directory,
    url: "https://youtu.be/mjdHmPvNmB0",
    visibility: "public",
    recordedBy: "Jean Hugues Noël Robert",
    publishedAt: "2026-07-14T07:00:00+02:00",
  });

  assert.equal(result.status, "published");
  assert.equal(result.video_id, "mjdHmPvNmB0");
  assert.equal(result.evidence.type, "human_confirmation");
  assert.equal(result.evidence.remote_verification, "not_performed");

  const publicationPackage = await readJson(path.join(directory, "youtube-package.json"));
  const manifest = await readJson(path.join(directory, "manifest.json"));
  const publication = await readJson(path.join(directory, "publication.youtube.json"));

  assert.equal(publicationPackage.status, "published");
  assert.equal(publicationPackage.upload_status, "published");
  assert.equal(publicationPackage.publication_result.video_id, "mjdHmPvNmB0");
  assert.equal(manifest.publication_status, "published");
  assert.equal(manifest.publication_assets.youtube_publication.video_id, "mjdHmPvNmB0");
  assert.equal(publication.video.sha256, "video-sha");
});

async function writeJson(filename, value) {
  await writeFile(filename, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readJson(filename) {
  return JSON.parse(await readFile(filename, "utf8"));
}
