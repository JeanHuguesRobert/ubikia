#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { buildProviderChainFromCliOptions } from "../src/audible/providers/cli-provider-options.js";
import { renderAudibleProduct } from "../src/audible/render.js";

const options = parseArguments(process.argv.slice(2));

if (!options.input && !options.text) {
  fail("Use --input <source-markdown>, --text <text>, or positional <source> <output> [spoken].");
}
if (!options.output) {
  fail("Use --output <directory> or positional <source> <output> [spoken].");
}

const sourceText = options.text ?? await readFile(options.input, "utf8");
const speechText = options.spoken
  ? await readFile(options.spoken, "utf8")
  : sourceText;
const sourceReference = options.input ? path.resolve(options.input) : "inline-text";
const adaptationReference = options.spoken ? path.resolve(options.spoken) : null;

const chain = buildProviderChainFromCliOptions(options);
const forceRerender = options.forceRerender === true || options.forceRerender === "true";

const manifest = await renderAudibleProduct({
  sourceText,
  speechText,
  sourceReference,
  adaptationReference,
  outputDirectory: path.resolve(options.output),
  providerChain: chain.chain,
  forceRerender,
  maxCharacters: options.maxCharacters
    ? Number.parseInt(options.maxCharacters, 10)
    : 900,
});

console.log(JSON.stringify({
  output: path.resolve(options.output),
  segments: manifest.segment_count,
  format: manifest.output_format,
  provider_id: manifest.provider_id,
  providers_used: manifest.providers_used,
  mixed_providers: manifest.mixed_providers,
  force_rerender: manifest.force_rerender,
  source: sourceReference,
  spoken: adaptationReference,
  manifest: path.resolve(options.output, "manifest.json"),
}, null, 2));

function parseArguments(argumentsList) {
  const result = {};
  const positional = [];
  const booleanFlags = new Set(["forceRerender", "help"]);

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
    if (booleanFlags.has(key)) {
      result[key] = true;
      continue;
    }

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
  if (!result.spoken && positional[2]) {
    result.spoken = positional[2];
  }

  return result;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function fail(message) {
  console.error(message);
  console.error("Examples:");
  console.error("  node --env-file=.env cli/audible-render.js source.md artifacts/audible/article spoken.reviewed.md");
  console.error("  node --env-file=.env cli/audible-render.js --provider cartesia --fallback-providers gradium ...");
  console.error("  node --env-file=.env cli/audible-render.js --force-rerender --provider cartesia ...");
  process.exit(1);
}
