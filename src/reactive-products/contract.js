import { readFile, realpath } from "node:fs/promises";
import { parse, stringify } from "yaml";

export { stringify };

export function mapping(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a mapping`);
  }
  return value;
}

export function nonempty(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

export function parseYaml(text, label) {
  try {
    return mapping(parse(text, { uniqueKeys: true, maxAliasCount: 100 }), label);
  } catch (error) {
    throw new Error(`Invalid YAML in ${label}: ${error.message}`);
  }
}

export async function readInput(filename) {
  try {
    const sourcePath = await realpath(filename);
    return { path: sourcePath, bytes: await readFile(sourcePath) };
  } catch (error) {
    throw new Error(`Cannot read required source ${filename}: ${error.message}`, { cause: error });
  }
}

export function validateContract(value) {
  const contract = mapping(value, "Projection Contract");
  for (const field of ["schema", "id", "title", "language", "source_manifest"]) {
    nonempty(contract[field], `projection.${field}`);
  }
  if (!["ubikia.projection.book.v0", "suicide-corse.projection.book.v0"].includes(contract.schema)) {
    throw new Error(`Unsupported projection schema: ${contract.schema}`);
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(contract.id)) {
    throw new Error("projection.id must contain only letters, digits, underscores and hyphens");
  }
  for (const field of ["subtitle", "author", "medium", "previous_edition_id", "parent_edition_id"]) {
    if (contract[field] !== undefined) nonempty(contract[field], `projection.${field}`);
  }
  if (!Array.isArray(contract.chapters) || !contract.chapters.length) {
    throw new Error("projection.chapters must be a non-empty ordered array");
  }
  for (const chapter of contract.chapters) nonempty(chapter, "projection.chapters entry");
  if (new Set(contract.chapters).size !== contract.chapters.length) {
    throw new Error("projection.chapters must not contain duplicates");
  }
  const outputs = contract.outputs?.required;
  if (!Array.isArray(outputs) || !outputs.length || outputs.some((item) => !["html", "pdf"].includes(item))
      || new Set(outputs).size !== outputs.length) {
    throw new Error("projection.outputs.required must be a unique, non-empty array of html and/or pdf");
  }
  if (contract.outputs.optional !== undefined && (!Array.isArray(contract.outputs.optional)
      || contract.outputs.optional.some((item) => typeof item !== "string"))) {
    throw new Error("projection.outputs.optional must be an array of format names");
  }
  const invariants = {
    canonical_source_format: "markdown",
    generated_qmd_is_source: false,
    preserve_frontmatter_provenance: true,
    preserve_epistemic_distinctions: true,
    frozen_release_mutable: false,
  };
  if (contract.render_contract !== undefined) {
    mapping(contract.render_contract, "projection.render_contract");
    for (const [key, expected] of Object.entries(invariants)) {
      if (contract.render_contract[key] !== undefined && contract.render_contract[key] !== expected) {
        throw new Error(`projection.render_contract.${key} must be ${expected}`);
      }
    }
  }
  return contract;
}

export async function loadContract(filename) {
  const input = await readInput(filename);
  return { ...input, data: validateContract(parseYaml(input.bytes.toString("utf8"), input.path)) };
}
