#!/usr/bin/env node

import { createHash } from "node:crypto";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { createSpokenAdaptationWorkspace, validateSpokenAdaptation } from "../src/audible/adapt.js";
import { assembleAudibleProduct } from "../src/audible/assemble.js";
import { GradiumTTSProvider } from "../src/audible/providers/gradium.js";
import { renderAudibleProduct } from "../src/audible/render.js";
import { reviewSpokenAdaptation } from "../src/audible/review.js";

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

const [sourceText, spokenText] = await Promise.all([
  readFile(sourceFile, "utf8"),
  readFile(spokenFile, "utf8"),
]);

const validation = validateSpokenAdaptation({ sourceText, spokenText });
if (validation.warnings.length > 0 && options.acknowledgeWarnings !== true) {
  console.error(JSON.stringify(validation, null, 2));
  fail("Mechanical validation warnings remain. Review them, then rerun with --acknowledge-warnings.");
}

await createSpokenAdaptationWorkspace({
  sourceText,
  outputDirectory,
  metadata: {
    sourceReference: sourceFile,
    title: options.title ?? null,
    series: options.series ?? null,
    author: options.author ?? reviewer,
    language: options.language ?? "fr",
    audience: options.audience ?? "general public",
  },
});

const workspaceDraft = path.join(outputDirectory, "spoken.draft.md");
await copyFile(spokenFile, workspaceDraft);

const adaptationPath = path.join(outputDirectory, "adaptation.json");
const adaptation = JSON.parse(await readFile(adaptationPath, "utf8"));
adaptation.updated_at = new Date().toISOString();
adaptation.status = "draft_unreviewed";
adaptation.spoken_product = {
  ...(adaptation.spoken_product ?? {}),
  filename: "spoken.draft.md",
  sha256: sha256(spokenText),
  adaptation_method: "governed_human_or_agent_adaptation",
  human_review_required: true,
  reviewed: false,
};
adaptation.validation = validation;
await writeFile(adaptationPath, `${JSON.stringify(adaptation, null, 2)}\n`, "utf8");

const review = await reviewSpokenAdaptation({
  outputDirectory,
  review: {
    decision: "approve",
    reviewer,
    notes: options.notes ?? "Approved for governed audio rendering.",
    acknowledgeWarnings: options.acknowledgeWarnings === true,
  },
});

const reviewedFile = path.join(outputDirectory, "spoken.reviewed.md");
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
  review: {
    status: review.adaptation.status,
    reviewer: review.review.reviewer,
    reviewed_at: review.review.reviewed_at,
    spoken_sha256: review.review.reviewed_sha256,
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

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function fail(message) {
  console.error(message);
  console.error("Use: npm run audible:finalize -- <source.md> <spoken.md> <output-directory> --reviewer \"Name\"");
  process.exit(1);
}
