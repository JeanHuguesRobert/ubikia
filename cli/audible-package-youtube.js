#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { createYouTubePublicationPackage } from "../src/audible/package-youtube.js";

const [outputDirectory, metadataFile] = process.argv.slice(2);

if (!outputDirectory || !metadataFile) {
  console.error("Use: npm run audible:package:youtube -- <artifact-directory> <metadata.json>");
  process.exit(1);
}

const metadata = JSON.parse(await readFile(path.resolve(metadataFile), "utf8"));
const publicationPackage = await createYouTubePublicationPackage({
  outputDirectory,
  metadata,
});

console.log(JSON.stringify({
  output: path.resolve(outputDirectory),
  status: publicationPackage.status,
  title: publicationPackage.title,
  video: publicationPackage.video.filename,
  package: path.resolve(outputDirectory, "youtube-package.json"),
  description: path.resolve(outputDirectory, "youtube-description.md"),
}, null, 2));
