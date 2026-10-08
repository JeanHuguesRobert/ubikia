import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { parse } from "yaml";

const digest = (x) => createHash("sha256").update(x).digest("hex");
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const safePath = (p) => {
  if (typeof p !== "string" || !p || p.startsWith("/") || p.includes("\\") || p.split("/").includes("..") || path.posix.normalize(p) !== p) throw Error("unsafe source path");
  return p;
};
const sha = (s) => typeof s === "string" && /^[a-f0-9]{40}$/i.test(s);
const repoName = (s) => typeof s === "string" && /^[\w.-]+\/[\w.-]+$/.test(s);
const quote = (s) => JSON.stringify(s);

export async function buildTextProduct({ contract, output, checkouts = {} }) {
  const manifest = parse(await readFile(contract, "utf8"));
  if (manifest?.schema !== "ubikia.text-product.v1") throw Error("unsupported schema");
  if (!Array.isArray(manifest.sections) || !manifest.sections.length) throw Error("sections required");
  if (typeof manifest.title !== "string" || !manifest.title.trim()) throw Error("title required");
  if (!output || !output.endsWith(".md")) throw Error("output .md required");
  const entries = [], chunks = [];
  for (const section of manifest.sections) {
    if (typeof section !== "object" || !section) throw Error("invalid section");
    if (section.kind === "literal") {
      if (typeof section.text !== "string") throw Error("literal text required");
      chunks.push(section.text);
      continue;
    }
    if (section.kind !== "github-verbatim") throw Error("unsupported section kind");
    const { repository, ref, file } = section;
    if (!repoName(repository) || !sha(ref)) throw Error("repository and exact commit required");
    safePath(file);
    const root = checkouts[repository];
    if (!root) throw Error("missing trusted checkout: " + repository);
    // git show reads the exact committed blob; no worktree state, network, or executable Markdown.
    const rootDir = path.resolve(root);
    const resolvedHead = git(rootDir, "rev-parse", "--show-toplevel");
    if (path.resolve(resolvedHead) !== rootDir) throw Error("checkout must be Git root");
    const origin = git(rootDir, "remote", "get-url", "origin");
    const matches = origin.includes(repository + ".git") || origin.endsWith(repository);
    if (!matches) throw Error("checkout remote mismatch: " + repository);
    const blob = execFileSync("git", ["show", ref + ":" + file], { cwd: rootDir, encoding: "buffer", maxBuffer: 32 * 1024 * 1024 });
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(blob);
    const url = "https://github.com/" + repository + "/blob/";
    entries.push({ repository, ref, file, sha256: digest(blob), bytes: blob.length, immutable_url: url + ref + "/" + file, living_url: url + "main/" + file });
    chunks.push(raw);
  }
  // Newlines are explicitly inserted only between sections. Verbatim bytes within sections remain unchanged.
  const body = chunks.join("\n\n");
  const bytes = Buffer.from(body, "utf8");
  const out = path.resolve(output);
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, bytes, { flag: "wx" });
  const receipt = { schema: "ubikia.text-product-result.v1", title: manifest.title, sources: entries, output: { filename: path.basename(out), bytes: bytes.length, sha256: digest(bytes) }, status: "draft-not-sent" };
  await writeFile(out + ".manifest.json", JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
  return receipt;
}
