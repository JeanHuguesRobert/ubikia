#!/usr/bin/env node

import path from "node:path";
import process from "node:process";

import { recordYouTubePublication } from "../src/audible/record-publication.js";

const [outputDirectory, url, visibility = "public", recordedByArgument, publishedAt] = process.argv.slice(2);
const recordedBy = recordedByArgument ?? process.env.UBIKIA_REVIEWER ?? null;

if (!outputDirectory || !url) {
  console.error(
    "Use: npm run audible:record:youtube -- <artifact-directory> <youtube-url> [visibility] [recorded-by] [published-at]",
  );
  process.exit(1);
}

const publication = await recordYouTubePublication({
  outputDirectory,
  url,
  visibility,
  recordedBy,
  publishedAt,
});

console.log(JSON.stringify({
  output: path.resolve(outputDirectory),
  status: publication.status,
  platform: publication.platform,
  url: publication.url,
  video_id: publication.video_id,
  visibility: publication.visibility,
  published_at: publication.published_at,
  recorded_by: publication.recorded_by,
  remote_verification: publication.evidence.remote_verification,
  publication: path.resolve(outputDirectory, "publication.youtube.json"),
  package: path.resolve(outputDirectory, "youtube-package.json"),
  manifest: path.resolve(outputDirectory, "manifest.json"),
}, null, 2));
