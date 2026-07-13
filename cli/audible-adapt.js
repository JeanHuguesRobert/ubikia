#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { createSpokenAdaptationWorkspace } from "../src/audible/adapt.js";

const options = parseArguments(process.argv.slice(2));

if (!options.input) {
  fail("Use positional <source-markdown> <output-directory> or --input <source-markdown>.");
}
if (!options.output) {
  fail("Use positional <source-markdown> <output-directory> or --output <directory>.");
}

const sourcePath = path.resolve(options.input);
const outputDirectory = path.resolve(options.output);
const sourceText = await readFile(sourcePath, "utf8");

const manifest = await createSpokenAdaptationWorkspace({
  sourceText,
  outputDirectory,
  metadata: {
    sourceReference: sourcePath,
    sourceUrl: options.sourceUrl ?? null,
    title: options.title ?? null,
    series: options.series ?? null,
    author: options.author ?? null,
    language: options.language ?? null,
    audience: options.audience ?? null,
    intro: options.intro ?? null,
    outro: options.outro ?? null,
  },
});

console.log(JSON.stringify({
  output: outputDirectory,
  status: manifest.status,
  source: path.join(outputDirectory, "source.md"),
  spokenDraft: path.join(outputDirectory, "spoken.draft.md"),
  adaptationRequest: path.join(outputDirectory, "adaptation-request.md"),
  manifest: path.join(outputDirectory, "adaptation.json"),
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
      result[toCamelCase(argument.slice(2, equalIndex))] = argument.slice(equalIndex + 1);
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

  result.input ??= positional[0];
  result.output ??= positional[1];
  return result;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function fail(message) {
  console.error(message);
  console.error("Example:");
  console.error("  npm run audible:adapt -- article.md artifacts/audible/article");
  process.exit(1);
}
