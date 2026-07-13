#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { reviewSpokenAdaptation } from "../src/audible/review.js";

const [outputDirectory, reviewFile] = process.argv.slice(2);

if (!outputDirectory || !reviewFile) {
  console.error("Use: npm run audible:review -- <artifact-directory> <review.json>");
  process.exit(1);
}

const review = JSON.parse(await readFile(path.resolve(reviewFile), "utf8"));
const result = await reviewSpokenAdaptation({
  outputDirectory,
  review,
});

console.log(JSON.stringify({
  output: path.resolve(outputDirectory),
  status: result.adaptation.status,
  reviewer: result.review.reviewer,
  reviewedAt: result.review.reviewed_at,
  spoken: path.resolve(outputDirectory, "spoken.reviewed.md"),
  review: path.resolve(outputDirectory, "review.json"),
}, null, 2));
