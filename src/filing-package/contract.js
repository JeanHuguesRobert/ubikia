import path from "node:path";
import { parse } from "yaml";
import { readFile, realpath } from "node:fs/promises";

function nonempty(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} must be a non-empty string`);
  return value;
}
function mapping(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be a mapping`);
  return value;
}
export function validateFilingContract(value) {
  const c = mapping(value, "filing package");
  if (c.schema !== "ubikia.filing-package.v0") throw new Error(`Unsupported filing schema: ${c.schema}`);
  for (const f of ["id","title","source_root"]) nonempty(c[f], `filing.${f}`);
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(c.id)) throw new Error("filing.id is invalid");
  mapping(c.artifact, "filing.artifact");
  nonempty(c.artifact.filename, "filing.artifact.filename");
  if (!/^[^/\\\\]+\.pdf$/i.test(c.artifact.filename)) throw new Error("filing.artifact.filename must be a PDF basename");
  if (c.release !== undefined && c.release !== null) {
    mapping(c.release, "filing.release");
    for (const f of ["repository","tag","title"]) nonempty(c.release[f], `filing.release.${f}`);
    if (c.release.immutable_required !== true) throw new Error("filing.release.immutable_required must be true");
  }
  if (!Array.isArray(c.sections) || !c.sections.length) throw new Error("filing.sections must be non-empty");
  const ids = new Set();
  for (const section of c.sections) {
    mapping(section, "filing.sections entry");
    nonempty(section.id, "section.id"); nonempty(section.title, "section.title");
    if (!Array.isArray(section.items) || !section.items.length) throw new Error(`section ${section.id} has no items`);
    for (const item of section.items) {
      mapping(item, "section item"); nonempty(item.id, "item.id");
      if (ids.has(item.id)) throw new Error(`Duplicate filing item id: ${item.id}`);
      ids.add(item.id);
      if (!["markdown","pdf"].includes(item.kind)) throw new Error(`Unsupported item kind: ${item.kind}`);
      if (item.path !== null && item.path !== undefined) nonempty(item.path, `item ${item.id}.path`);
      if (item.required !== undefined && typeof item.required !== "boolean") throw new Error(`item ${item.id}.required must be boolean`);
    }
  }
  return c;
}
export async function loadFilingContract(filename) {
  const contractPath = await realpath(filename);
  const bytes = await readFile(contractPath);
  let parsed;
  try { parsed = parse(bytes.toString("utf8"), { uniqueKeys:true, maxAliasCount:100 }); }
  catch (e) { throw new Error(`Invalid YAML in ${contractPath}: ${e.message}`); }
  const data = validateFilingContract(parsed);
  const sourceRoot = path.resolve(path.dirname(contractPath), data.source_root);
  return { path:contractPath, bytes, data, sourceRoot };
}
