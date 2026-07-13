import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  inspectSecretReferences,
  mergeConfigurationLayers,
} from "./merge-config-layers.js";

const DEFAULTS_FILE = fileURLToPath(new URL("../../config/defaults.json", import.meta.url));

export async function loadUserConfiguration({
  defaults = DEFAULTS_FILE,
  publicProfile,
  privateProfile = null,
  localProfile = null,
  overrides = null,
  environment = process.env,
} = {}) {
  if (!publicProfile) {
    throw new Error("publicProfile is required");
  }

  const specs = [
    normalizeSpec(defaults, "ubikia-defaults"),
    normalizeSpec(publicProfile, "public-profile"),
    normalizeSpec(privateProfile, "private-profile"),
    normalizeSpec(localProfile, "local-profile"),
    normalizeSpec(overrides, "job-overrides"),
  ].filter(Boolean);

  const layers = [];
  for (const spec of specs) {
    layers.push(await loadJsonLayer(spec));
  }

  validatePublicProfile(layers.find((layer) => layer.name === "public-profile")?.value);

  const merged = mergeConfigurationLayers(layers);
  const instructions = [];
  for (const layer of layers) {
    if (layer.name === "ubikia-defaults") continue;
    instructions.push(...await loadInstructionDocuments(layer));
  }

  return {
    schema: "ubikia.resolved-user-configuration.v0.1",
    resolved_at: new Date().toISOString(),
    ...merged,
    secret_references: inspectSecretReferences(merged.config, { environment }),
    instructions,
  };
}

export function serializeResolvedUserConfiguration(result, {
  includeInstructionContent = false,
} = {}) {
  return {
    ...result,
    instructions: result.instructions.map((instruction) => ({
      ...instruction,
      ...(includeInstructionContent ? {} : { content: undefined }),
    })),
  };
}

export async function loadJsonLayer(spec) {
  const filename = path.resolve(spec.filename);
  const content = await readFile(filename, "utf8");
  let value;
  try {
    value = JSON.parse(content);
  } catch (error) {
    throw new SyntaxError(`Invalid JSON in ${filename}: ${error.message}`);
  }

  return {
    name: spec.name,
    source: spec.source ?? filename,
    commit: spec.commit ?? null,
    filename,
    rootDirectory: spec.rootDirectory
      ? path.resolve(spec.rootDirectory)
      : inferProfileRoot(filename),
    value,
    sha256: sha256(content),
  };
}

async function loadInstructionDocuments(layer) {
  const profileDirectory = path.dirname(layer.filename);
  const configured = Array.isArray(layer.value.instructionFiles)
    ? layer.value.instructionFiles
    : [];

  const candidates = configured.length > 0
    ? configured.map((candidate) => ({ candidate, base: layer.rootDirectory }))
    : [{ candidate: "instructions.md", base: profileDirectory }];
  const documents = [];

  for (const { candidate, base } of candidates) {
    const filename = path.isAbsolute(candidate)
      ? candidate
      : path.resolve(base, candidate);

    if (!(await isRegularFile(filename))) {
      if (configured.length > 0) {
        throw new Error(`Instruction file declared by ${layer.source} was not found: ${filename}`);
      }
      continue;
    }

    const content = await readFile(filename, "utf8");
    documents.push({
      layer: layer.name,
      source: layer.source,
      commit: layer.commit,
      filename,
      sha256: sha256(content),
      content,
    });
  }

  return documents;
}

function normalizeSpec(spec, defaultName) {
  if (!spec) return null;
  if (typeof spec === "string") {
    return {
      name: defaultName,
      filename: spec,
      source: path.resolve(spec),
      commit: null,
      rootDirectory: null,
    };
  }
  if (typeof spec !== "object" || typeof spec.filename !== "string") {
    throw new TypeError(`${defaultName} must be a filename or a file specification object`);
  }
  return {
    name: spec.name ?? defaultName,
    filename: spec.filename,
    source: spec.source ?? path.resolve(spec.filename),
    commit: spec.commit ?? null,
    rootDirectory: spec.rootDirectory ?? null,
  };
}

function inferProfileRoot(filename) {
  const directory = path.dirname(filename);
  return path.basename(directory).toLowerCase() === ".ubikia"
    ? path.dirname(directory)
    : directory;
}

function validatePublicProfile(profile) {
  if (!profile || typeof profile !== "object") {
    throw new TypeError("The public profile must be a JSON object");
  }
  if (profile.schema !== "ubikia.user-profile.v0.1") {
    throw new Error("The public profile must use schema ubikia.user-profile.v0.1");
  }
  for (const property of ["account", "displayName", "defaultLanguage", "publicationPolicy"]) {
    if (profile[property] === undefined || profile[property] === null || profile[property] === "") {
      throw new Error(`The public profile requires ${property}`);
    }
  }
}

async function isRegularFile(filename) {
  try {
    return (await stat(filename)).isFile();
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
