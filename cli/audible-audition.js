#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { GradiumTTSProvider } from "../src/audible/providers/gradium.js";
import { renderAudibleProduct } from "../src/audible/render.js";

const options = parseArguments(process.argv.slice(2));
const [inputArgument, outputArgument] = options.positionals;

const inputFile = options.input ?? inputArgument ?? null;
const outputDirectory = path.resolve(
  options.output
    ?? outputArgument
    ?? path.join("artifacts", "audible", "audition"),
);
const prepareOnly = options.prepareOnly === true || options.prepareOnly === "true";

if (!inputFile && !options.text) {
  fail("Provide --input <pronunciation-audition.txt>, --text <sample>, or a positional input file.");
}

const speechText = options.text
  ?? await readFile(path.resolve(inputFile), "utf8");

if (speechText.trim() === "") {
  fail("Audition text is empty.");
}

await mkdir(outputDirectory, { recursive: true });
const auditionSource = path.join(outputDirectory, "audition.txt");
await writeFile(auditionSource, ensureFinalNewline(speechText), "utf8");

if (prepareOnly) {
  console.log(JSON.stringify({
    status: "prepared",
    output: outputDirectory,
    audition_text: auditionSource,
    characters: speechText.length,
    tts_performed: false,
    note: "Prepared pronunciation sample without calling the TTS provider.",
  }, null, 2));
  process.exit(0);
}

const provider = new GradiumTTSProvider({
  outputFormat: options.format ?? process.env.UBIKIA_AUDIO_FORMAT ?? "wav",
});

const manifest = await renderAudibleProduct({
  sourceText: speechText,
  speechText,
  sourceReference: inputFile ? path.resolve(inputFile) : "inline-audition-text",
  adaptationReference: auditionSource,
  outputDirectory,
  provider,
  maxCharacters: options.maxCharacters
    ? Number.parseInt(options.maxCharacters, 10)
    : 900,
});

console.log(JSON.stringify({
  status: "rendered",
  output: outputDirectory,
  segments: manifest.segment_count,
  format: manifest.output_format,
  voice_id: manifest.voice_id,
  spoken_text_sha256: manifest.spoken_text_sha256,
  manifest: path.join(outputDirectory, "manifest.json"),
  tts_performed: true,
  publication_performed: false,
}, null, 2));

function parseArguments(argumentsList) {
  const result = { positionals: [] };
  const booleanFlags = new Set(["prepareOnly", "help"]);

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
    if (booleanFlags.has(key)) {
      result[key] = true;
      continue;
    }

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

function ensureFinalNewline(value) {
  return value.endsWith("\n") ? value : `${value}\n`;
}

function fail(message) {
  console.error(message);
  console.error("Examples:");
  console.error("  npm run audible:audition:prepare -- examples/audible/le-pere-noel-revient/pronunciation-audition.txt artifacts/audible/le-pere-noel-revient/audition");
  console.error("  npm run audible:audition -- examples/audible/le-pere-noel-revient/pronunciation-audition.txt artifacts/audible/le-pere-noel-revient/audition");
  process.exit(1);
}
