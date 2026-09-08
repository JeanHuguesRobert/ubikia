import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { gitValue } from "./corpus.js";

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const fingerprint = (input) => ({ path: input.path, sha256: sha256(input.bytes) });

export async function outputFiles(directory, relative = "_book") {
  const files = [];
  for (const entry of (await readdir(path.join(directory, relative), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const filename = `${relative}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await outputFiles(directory, filename));
    else if (entry.isFile()) files.push({ path: filename, sha256: sha256(await readFile(path.join(directory, filename))) });
    else throw new Error(`Unexpected non-regular renderer output: ${filename}`);
  }
  return files;
}

export function buildManifest({ ir, corpus, projection, rendererVersion, generated, artifacts }) {
  const sources = [...new Map(corpus.sources.map((source) => [source.path, source])).values()];
  const gitStatus = corpus.repositoryRoot === null ? null
    : gitValue(corpus.repositoryRoot, ["status", "--porcelain", "--untracked-files=normal"]);
  return {
    schema: "ubikia.reactive-build.v0",
    edition_id: ir.editionId,
    medium: ir.medium,
    previous_edition_id: ir.previousEditionId,
    parent_edition_id: ir.parentEditionId,
    built_at: new Date().toISOString(),
    publication_status: "draft",
    projection: { ...fingerprint(projection), schema: projection.data.schema, contract: projection.data },
    source_manifest: fingerprint(corpus),
    sources: sources.map((source) => ({ ...fingerprint(source), role: source.role,
      git_commit: gitValue(path.dirname(source.path), ["rev-parse", "HEAD"]) })),
    source_git_commit: gitValue(path.dirname(corpus.path), ["rev-parse", "HEAD"]),
    source_git_dirty: gitStatus === null ? null : gitStatus !== "",
    chapters: ir.chapters.map(({ sourcePath, frontmatter }) => ({ path: sourcePath, frontmatter })),
    missing_optional_sources: corpus.missingOptional,
    renderer: { name: "quarto", version: rendererVersion },
    generator: { name: "ubikia.reactive-products", version: "0" },
    generated: Object.entries(generated).map(([filename, content]) => ({ path: filename, sha256: sha256(content) })),
    outputs: ir.outputs.map((format) => {
      const filename = format === "html" ? "_book/index.html" : `_book/${ir.editionId}.pdf`;
      const file = artifacts.find((entry) => entry.path === filename);
      if (!file) throw new Error(`Quarto did not produce required ${format} output: ${filename}`);
      return { format, ...file };
    }),
    artifacts,
  };
}
