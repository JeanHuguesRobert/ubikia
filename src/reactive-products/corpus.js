import path from "node:path";
import { execFileSync } from "node:child_process";
import { mapping, nonempty, parseYaml, readInput } from "./contract.js";

export function gitValue(directory, args) {
  try {
    return execFileSync("git", ["--no-optional-locks", "-C", directory, ...args], {
      encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 10000,
    }).trim();
  } catch {
    return null;
  }
}

export function parseMarkdown(text, sourcePath) {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n(?:---|\.\.\.)[ \t]*(?:\n|$)/);
  if (!match) throw new Error(`Missing or unclosed YAML frontmatter in ${sourcePath}`);
  return {
    frontmatter: parseYaml(match[1], sourcePath),
    content: normalized.slice(match[0].length),
  };
}

export async function loadCorpus(filename, projection) {
  const input = await readInput(filename);
  const data = parseYaml(input.bytes.toString("utf8"), input.path);
  const declared = await readInput(path.resolve(path.dirname(projection.path), projection.data.source_manifest));
  if (declared.path !== input.path) {
    throw new Error("--corpus does not match projection.source_manifest");
  }
  if (!Array.isArray(data.sources)) throw new Error("corpus.sources must be an array");
  const repositoryRoot = gitValue(path.dirname(input.path), ["rev-parse", "--show-toplevel"]);
  // The real Suicide Corse manifest uses repository-relative documentary paths.
  const sourceRoot = data.source_root === undefined
    ? repositoryRoot ?? path.dirname(input.path)
    : path.resolve(path.dirname(input.path), nonempty(data.source_root, "corpus.source_root"));
  const sources = [];
  const missingOptional = [];
  for (const entry of data.sources) {
    mapping(entry, "corpus.sources entry");
    nonempty(entry.path, "corpus.sources.path");
    if (entry.required !== undefined && typeof entry.required !== "boolean") {
      throw new Error("corpus.sources.required must be a boolean");
    }
    const sourcePath = path.resolve(sourceRoot, entry.path);
    try {
      sources.push({ ...await readInput(sourcePath), role: entry.role ?? null });
    } catch (error) {
      if (entry.required !== false || error.cause?.code !== "ENOENT") throw error;
      missingOptional.push(sourcePath);
    }
  }
  const chapters = [];
  for (const chapter of projection.data.chapters) {
    const source = await readInput(path.resolve(path.dirname(projection.path), chapter));
    if (path.extname(source.path).toLowerCase() !== ".md") {
      throw new Error(`Canonical chapter must be Markdown (.md): ${source.path}`);
    }
    if (chapters.some((item) => item.sourcePath === source.path)) {
      throw new Error(`Duplicate resolved chapter: ${source.path}`);
    }
    chapters.push({ sourcePath: source.path, ...parseMarkdown(source.bytes.toString("utf8"), source.path) });
    sources.push({ ...source, role: "chapter" });
  }
  return { ...input, data, sources, chapters, missingOptional, repositoryRoot };
}
