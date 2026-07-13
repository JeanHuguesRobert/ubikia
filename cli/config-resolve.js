#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  loadUserConfiguration,
  serializeResolvedUserConfiguration,
} from "../src/config/load-user-profile.js";

const options = parseArguments(process.argv.slice(2));

if (!options.public) {
  fail("A public profile is required.");
}
if (!options.output) {
  fail("An output filename or '-' for stdout is required.");
}

const result = await loadUserConfiguration({
  publicProfile: fileSpec(options.public, options.publicSource, options.publicCommit),
  privateProfile: fileSpec(options.private, options.privateSource, options.privateCommit),
  localProfile: fileSpec(options.local, options.localSource, options.localCommit),
  overrides: fileSpec(options.overrides, options.overridesSource, options.overridesCommit),
});

const serializable = serializeResolvedUserConfiguration(result, {
  includeInstructionContent: asBoolean(
    options.includeInstructionContent
      ?? process.env.UBIKIA_INCLUDE_INSTRUCTION_CONTENT,
  ),
});
const json = `${JSON.stringify(serializable, null, 2)}\n`;

if (options.output === "-") {
  process.stdout.write(json);
} else {
  const destination = path.resolve(options.output);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, json, "utf8");
}

const secretSummary = result.secret_references.reduce((summary, reference) => {
  summary[reference.status] = (summary[reference.status] ?? 0) + 1;
  return summary;
}, {});

console.error(JSON.stringify({
  account: result.config.account,
  output: options.output === "-" ? "stdout" : path.resolve(options.output),
  layers: result.layers.map((layer) => layer.name),
  provenanceEntries: Object.keys(result.provenance).length,
  instructionDocuments: result.instructions.length,
  instructionContentSerialized: asBoolean(
    options.includeInstructionContent
      ?? process.env.UBIKIA_INCLUDE_INSTRUCTION_CONTENT,
  ),
  secretReferences: secretSummary,
  invariants: result.invariants.map(({ path: invariantPath, status }) => ({
    path: invariantPath,
    status,
  })),
}, null, 2));

function fileSpec(filename, source, commit) {
  if (!filename) return null;
  return {
    filename,
    source: source ?? path.resolve(filename),
    commit: commit ?? null,
  };
}

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

  result.public ??= positional[0];
  result.output ??= positional[1];
  result.private ??= positional[2];
  result.local ??= positional[3];
  result.overrides ??= positional[4];
  return result;
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function asBoolean(value) {
  if (value === true) return true;
  if (typeof value !== "string") return false;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function fail(message) {
  console.error(message);
  console.error("Positional usage:");
  console.error("  npm run config:resolve -- <public-profile> <output> [private-profile] [local-profile] [overrides]");
  console.error("Example:");
  console.error("  npm run config:resolve -- ..\\JeanHuguesRobert\\.ubikia\\profile.json artifacts\\config\\resolved.json");
  process.exit(1);
}
