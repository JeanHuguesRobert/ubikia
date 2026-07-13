#!/usr/bin/env node

import path from "node:path";
import process from "node:process";

import { createStaticYouTubeVideo } from "../src/audible/video.js";

const [outputDirectory, imageFile, basename] = process.argv.slice(2);

if (!outputDirectory || !imageFile) {
  console.error("Use: npm run audible:video -- <artifact-directory> <artwork-image> [basename]");
  process.exit(1);
}

const manifest = await createStaticYouTubeVideo({
  outputDirectory,
  imageFile,
  basename: basename ?? path.basename(path.resolve(outputDirectory)),
});

console.log(JSON.stringify({
  output: path.resolve(outputDirectory),
  video: manifest.publication_assets.youtube_video,
  manifest: path.resolve(outputDirectory, "manifest.json"),
}, null, 2));
