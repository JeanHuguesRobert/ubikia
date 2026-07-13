#!/usr/bin/env node

import path from "node:path";
import process from "node:process";

import { assembleAudibleProduct } from "../src/audible/assemble.js";

const options = parseArguments(process.argv.slice(2));
const outputDirectory = options.directory ?? options.positionals[0];

if (!outputDirectory) {
  fail("Use --directory <render-directory> or positional <render-directory>.");
}

const basename = options.basename ?? path.basename(path.resolve(outputDirectory));
const formats = String(options.formats ?? "mp3,opus")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const manifest = await assembleAudibleProduct({
  outputDirectory,
  basename,
  formats,
  ffmpegPath: options.ffmpeg ?? process.env.FFMPEG_PATH ?? "ffmpeg",
  ffprobePath: options.ffprobe ?? process.env.FFPROBE_PATH ?? "ffprobe",
  overwrite: options.overwrite !== "false",
});

console.log(JSON.stringify({
  output: path.resolve(outputDirectory),
  assembly_status: manifest.assembly_status,
  products: manifest.assembly.products,
  manifest: path.resolve(outputDirectory, "manifest.json"),
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
  console.error("Example: npm run audible:assemble -- artifacts/audible/article");
  process.exit(1);
}
