import { mkdir, mkdtemp, realpath, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadProjection } from "./ir.js";
import { gitValue } from "./corpus.js";
import { generateQmd } from "./qmd.js";
import { createQuartoAdapter } from "./quarto.js";
import { buildManifest, outputFiles, sha256 } from "./manifest.js";

function inside(root, target) {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

export async function render({ corpus: corpusPath, projection: projectionPath, output, quarto = createQuartoAdapter() } = {}) {
  if (!corpusPath || !projectionPath) throw new Error("Both --corpus and --projection are required");
  const loaded = await loadProjection(corpusPath, projectionPath);
  const { corpus, projection, ir } = loaded;
  const inputs = [corpus, projection, ...corpus.sources];
  const roots = inputs.map((source) => gitValue(path.dirname(source.path), ["rev-parse", "--show-toplevel"])
    ?? path.dirname(source.path));
  const parent = await realpath(output ? path.dirname(path.resolve(output)) : tmpdir());
  const destination = output ? path.join(parent, path.basename(path.resolve(output))) : parent;
  if (roots.some((root) => inside(root, destination))) {
    throw new Error("Output must be outside every source repository/directory (including symlink aliases)");
  }
  const generated = generateQmd(ir);
  const rendererVersion = await quarto.version();
  // An exclusive, fresh directory prevents stale outputs or overwrite of frozen editions.
  let directory;
  if (output) {
    await mkdir(destination);
    directory = destination;
  } else {
    directory = await mkdtemp(path.join(parent, "ubikia-render-"));
  }
  try {
    for (const [filename, content] of Object.entries(generated)) {
      await writeFile(path.join(directory, filename), content, { flag: "wx" });
    }
    await quarto.render(directory, ir.outputs);
    const artifacts = await outputFiles(directory);
    const manifest = buildManifest({ ...loaded, rendererVersion, generated, artifacts });
    for (const input of inputs) {
      if (sha256(await readFile(input.path)) !== sha256(input.bytes)) {
        throw new Error(`Source changed during render; retry from a stable snapshot: ${input.path}`);
      }
    }
    for (const artifact of manifest.outputs) {
      const bytes = await readFile(path.join(directory, artifact.path));
      if (artifact.format === "pdf" ? bytes.subarray(0, 5).toString() !== "%PDF-"
        : !/<html[\s>]/i.test(bytes.toString("utf8"))) {
        throw new Error(`Invalid ${artifact.format} artifact: ${artifact.path}`);
      }
    }
    await writeFile(path.join(directory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
    return { directory, manifest };
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}
