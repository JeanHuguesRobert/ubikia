#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { createYouTubePublicationPackage } from "../src/audible/package-youtube.js";
import { createStaticYouTubeVideo } from "../src/audible/video.js";

const [outputDirectory, imageFile, metadataFile, basename] = process.argv.slice(2);

if (!outputDirectory || !imageFile || !metadataFile) {
  console.error(
    "Use: npm run audible:prepare:youtube -- <artifact-directory> <artwork-image> <metadata.json> [basename]",
  );
  process.exit(1);
}

const absoluteOutput = path.resolve(outputDirectory);
const absoluteArtwork = path.resolve(imageFile);
const absoluteMetadata = path.resolve(metadataFile);
const metadata = JSON.parse(await readFile(absoluteMetadata, "utf8"));

const videoManifest = await createStaticYouTubeVideo({
  outputDirectory: absoluteOutput,
  imageFile: absoluteArtwork,
  basename: basename ?? path.basename(absoluteOutput),
});

const publicationPackage = await createYouTubePublicationPackage({
  outputDirectory: absoluteOutput,
  metadata,
});

console.log(JSON.stringify({
  output: absoluteOutput,
  video: videoManifest.publication_assets.youtube_video,
  package_status: publicationPackage.status,
  visibility: publicationPackage.visibility,
  altered_or_synthetic_content: publicationPackage.altered_or_synthetic_content,
  made_for_kids: publicationPackage.made_for_kids,
  publication_performed: false,
  package: path.join(absoluteOutput, "youtube-package.json"),
  title: path.join(absoluteOutput, "youtube-title.txt"),
  description: path.join(absoluteOutput, "youtube-description.md"),
}, null, 2));
