#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { GradiumTTSProvider } from "../src/audible/providers/gradium.js";
import { renderAudibleProduct } from "../src/audible/render.js";

const options = parseArguments(process.argv.slice(2));

if (!options.input && !options.text) {
  fail("Use --input <markdown-file>, --text <text>, or positional <input> <output>.");
}
if (!options.output) {
  fail("Use --output <directory> or positional <input> <output>.");
}

const sourceText = options.text ?? await readFile(options.input, "utf8");
const sourceReference = options.input ? path.resolve(options.input) : "inline-text";
const provider = new GradiumTTSProvider({
  outputFormat: options.format ?? process.env.UBIKIA_AUDIO_FORMAT ?? "wav",
});

const manifest = await renderAudibleProduct({
  sourceText,
  sourceReference,
  outputDirectory: path.resolve(options.output),
  provider,
  maxCharacters: options.maxCharacters
    ? Number.parseInt(options.maxCharacters, 10)
    : 2200,
});

console.log(JSON.stringify({
  output: path.resolve(options.output),
  segments: manifest.segment_count,
  format: manifest.output_format,
  manifest: path.resolve(options.output, "manifest.json"),
}, null, 2));

function parseArguments(argumentsList) {
  const result = {};
  const positional = [];

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];

    if (!argument.startsWith("--")) {
      positional.push(argument);
      continue;
    }

    const equalIndex = argument.indexOf("=");
    if (equalIndex > 2) {
      const key = toCamelCase(argument.slice(2, equalIndex));
      result[key] = argument.slice(equalIndex + 1);
      continue;
    }

    const key = toCamelCase(argument.slice(2));
    const value = argumentsList[index + 1];
    if (!value || value.startsWith("--")) {
      result[key] = true;
    } else {
      result[key] = value;
      index += 1;
    }
  }

  if (!result.input && !result.text && positional[0]) {
    result.input = positional[0];
  }
  if (!result.output && positional[1]) {
    result.output = positional[1];
  }

  return result;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function fail(message) {
  console.error(message);
  console.error("Examples:");
  console.error("  node --env-file=.env cli/audible-render.js --input article.md --output artifacts/audible/article");
  console.error("  npm run audible:render -- article.md artifacts/audible/article");
  process.exit(1);
}
