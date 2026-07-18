#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { assembleAudibleProduct } from "../src/audible/assemble.js";
import { prepareFinalizedAdaptationWorkspace } from "../src/audible/finalize-workspace.js";
import { GradiumTTSProvider } from "../src/audible/providers/gradium.js";
import { renderAudibleProduct } from "../src/audible/render.js";

const options = parseArguments(process.argv.slice(2));
const [sourceArgument, spokenArgument, outputArgument] = options.positionals;
const sourceFile = path.resolve(options.source ?? sourceArgument ?? "");
const spokenFile = path.resolve(options.spoken ?? spokenArgument ?? "");
const outputDirectory = path.resolve(options.output ?? outputArgument ?? "");
const reviewer = options.reviewer ?? process.env.UBIKIA_REVIEWER;

if (!sourceArgument && !options.source) fail("A source Markdown file is required.");
if (!spokenArgument && !options.spoken) fail("A reviewed spoken draft is required.");
if (!outputArgument && !options.output) fail("An output directory is required.");
if (!reviewer) fail("Use --reviewer <name> or set UBIKIA_REVIEWER.");

// Capture inputs into memory before any workspace mutation.
const [sourceText, spokenText] = await Promise.all([
  readFile(sourceFile, "utf8"),
  readFile(spokenFile, "utf8"),
]);

let prepared;
try {
  prepared = await prepareFinalizedAdaptationWorkspace({
    sourceText,
    spokenText,
    sourceFile,
    spokenFile,
    outputDirectory,
    reviewer,
    acknowledgeWarnings: options.acknowledgeWarnings === true,
    notes: options.notes ?? "Approved for governed audio rendering.",
    metadata: {
      title: options.title ?? null,
      series: options.series ?? null,
      author: options.author ?? reviewer,
      language: options.language ?? "fr",
      audience: options.audience ?? "general public",
      sourceUrl: options.sourceUrl ?? null,
    },
  });
} catch (error) {
  if (error?.validation) {
    console.error(JSON.stringify(error.validation, null, 2));
  }
  fail(error.message);
}

if (prepared.staging.aliasing_detected) {
  console.error(prepared.staging.message);
}

const reviewedFile = prepared.reviewedFile;
const provider = new GradiumTTSProvider({
  outputFormat: options.format ?? process.env.UBIKIA_AUDIO_FORMAT ?? "wav",
});

const renderManifest = await renderAudibleProduct({
  sourceText,
  speechText: spokenText,
  sourceReference: sourceFile,
  adaptationReference: reviewedFile,
  outputDirectory,
  provider,
  maxCharacters: options.maxCharacters
    ? Number.parseInt(options.maxCharacters, 10)
    : 900,
});

const basename = options.basename ?? path.basename(outputDirectory);
const formats = String(options.formats ?? "mp3,opus")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const assembledManifest = await assembleAudibleProduct({
  outputDirectory,
  basename,
  formats,
  ffmpegPath: options.ffmpeg ?? process.env.FFMPEG_PATH ?? "ffmpeg",
  ffprobePath: options.ffprobe ?? process.env.FFPROBE_PATH ?? "ffprobe",
  overwrite: options.overwrite !== "false",
});

console.log(JSON.stringify({
  output: outputDirectory,
  path_aliasing: prepared.aliasing,
  staging: prepared.staging,
  review: {
    status: prepared.review.adaptation.status,
    reviewer: prepared.review.review.reviewer,
    reviewed_at: prepared.review.review.reviewed_at,
    spoken_sha256: prepared.review.review.reviewed_sha256,
  },
  render: {
    status: renderManifest.status,
    segments: renderManifest.segment_count,
    source_sha256: renderManifest.source_sha256,
    spoken_text_sha256: renderManifest.spoken_text_sha256,
  },
  assembly: {
    status: assembledManifest.assembly_status,
    products: assembledManifest.assembly.products,
  },
  publication_performed: false,
}, null, 2));

function parseArguments(argumentsList) {
  const result = { positionals: [] };

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (!argument.startsWith("--")) {
      result.positionals.push(argument);
      continue;
    }

    const equalIndex = argument.indexOf("=");
    if (equalIndex > 2) {
      result[toCamelCase(argument.slice(2, equalIndex))] = argument.slice(equalIndex + 1);
      continue;
    }

    const key = toCamelCase(argument.slice(2));
    const value = argumentsList[index + 1];
    if (!value || value.startsWith("--")) result[key] = true;
    else {
      result[key] = value;
      index += 1;
    }
  }

  return result;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function fail(message) {
  console.error(message);
  console.error("Use: npm run audible:finalize -- <source.md> <spoken.md> <output-directory> --reviewer \"Name\"");
  process.exit(1);
}
