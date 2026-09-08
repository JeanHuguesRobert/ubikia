import assert from "node:assert/strict";
import test from "node:test";
import { cp, mkdtemp, mkdir, readFile, writeFile, rm, access, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";
import { loadContract, validateContract, parseYaml, stringify } from "../src/reactive-products/contract.js";
import { loadProjection } from "../src/reactive-products/ir.js";
import { generateQmd } from "../src/reactive-products/qmd.js";
import { sha256 } from "../src/reactive-products/manifest.js";
import { render } from "../src/reactive-products/render.js";
import { createQuartoAdapter } from "../src/reactive-products/quarto.js";

const repo = fileURLToPath(new URL("../", import.meta.url));
const example = path.join(repo, "examples/reactive-products");
const exampleContract = (await loadContract(path.join(example, "projections/book.yml"))).data;

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), "ubikia-reactive-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await cp(example, path.join(root, "source"), { recursive: true });
  return { root, source: path.join(root, "source"), corpus: path.join(root, "source/corpus.yml"),
    projection: path.join(root, "source/projections/book.yml"), output: path.join(root, "result") };
}

// A subprocess double exercises the adapter's actual argv/cwd/error handling.
// These bytes are NOT evidence of a real Quarto or TeX render.
async function fakeQuarto(root, mode = "success") {
  const executable = path.join(root, `quarto-${mode}.cjs`);
  await writeFile(executable, `#!${process.execPath}\n` + `
const fs = require('node:fs');
if (process.argv[2] === '--version') { console.log('test-double-1'); process.exit(0); }
if (process.argv.slice(2).join(' ') !== 'render . --to ' + process.argv[5] + ' --no-execute') process.exit(7);
if (${JSON.stringify(mode)} === 'failure') { console.error('TeX unavailable'); process.exit(9); }
const config = fs.readFileSync('_quarto.yml', 'utf8');
const id = config.match(/output-file: (.+)/)[1];
fs.mkdirSync('_book', { recursive: true });
if (process.argv[5] === 'html') {
  fs.writeFileSync('_book/index.html', '<!doctype html><html><body>Opening</body></html>');
  fs.writeFileSync('_book/chapter-001.html', '<html><body>Evidence</body></html>');
  fs.writeFileSync('_book/style.css', 'body {}');
} else if (${JSON.stringify(mode)} !== 'missing-pdf') {
  fs.writeFileSync('_book/' + id + '.pdf', ${JSON.stringify(mode)} === 'invalid-pdf' ? 'wrong' : '%PDF-1.7\\nTEST DOUBLE');
}
`, { mode: 0o755 });
  return createQuartoAdapter({ executable });
}

test("minimal and Suicide Corse contracts validate; contradictory or malformed fields fail", () => {
  assert.equal(validateContract(exampleContract).id, "minimal-book-0");
  assert.equal(validateContract({ ...exampleContract, schema: "suicide-corse.projection.book.v0" }).chapters.length, 5);
  for (const patch of [{ id: "../escape" }, { schema: "future.v2" }, { chapters: [] },
    { chapters: ["a.md", "a.md"] }, { outputs: { required: ["epub"] } },
    { outputs: { required: ["html", "html"] } }, { language: null },
    { render_contract: { preserve_epistemic_distinctions: false } }]) {
    assert.throws(() => validateContract({ ...exampleContract, ...patch }));
  }
  assert.throws(() => parseYaml("id: first\nid: second\n", "duplicate"), /Invalid YAML/);
});

test("ordered chapters preserve documentary metadata and generate deterministic QMD", async (t) => {
  const f = await fixture(t);
  const { ir } = await loadProjection(f.corpus, f.projection);
  assert.deepEqual(ir.chapters.map((c) => c.frontmatter.title), ["Opening", "Evidence", "Hypothesis", "Interpretation", "Unknowns"]);
  const first = generateQmd(ir);
  assert.deepEqual(first, generateQmd((await loadProjection(f.corpus, f.projection)).ir));
  assert.match(first["index.qmd"], /origin_ref: unknown/);
  assert.match(first["chapter-002.qmd"], /hypothesis, not an established fact/);
  assert.ok(first["index.qmd"].endsWith(ir.chapters[0].content));
  assert.equal(parseYaml(first["_quarto.yml"], "generated").execute.enabled, false);
  assert.doesNotMatch(first["_quarto.yml"], /built_at/);
});

test("chapter frontmatter is preserved without activating renderer options", async (t) => {
  const f = await fixture(t);
  const chapter = path.join(f.source, "manuscript/00-opening.md");
  await writeFile(chapter, "---\ntitle: Opening\nfilters: [do-not-execute.lua]\n---\n# Opening\n");
  const { ir } = await loadProjection(f.corpus, f.projection);
  const qmd = generateQmd(ir)["index.qmd"];
  const header = parseYaml(qmd.split("---\n")[1], "qmd");
  assert.equal(header.filters, undefined);
  assert.deepEqual(header.ubikia_source.frontmatter.filters, ["do-not-execute.lua"]);
});

test("adapter integration writes required outputs and verifiable provenance without changing sources", async (t) => {
  const f = await fixture(t);
  const before = await loadProjection(f.corpus, f.projection);
  const result = await render({ ...f, quarto: await fakeQuarto(f.root) });
  const manifest = JSON.parse(await readFile(path.join(result.directory, "manifest.json"), "utf8"));
  assert.equal(manifest.schema, "ubikia.reactive-build.v0");
  assert.equal(manifest.source_git_commit, null);
  assert.equal(manifest.publication_status, "draft");
  assert.equal(manifest.renderer.version, "test-double-1");
  assert.equal(manifest.chapters[0].frontmatter.review.status, "unreviewed");
  assert.equal(manifest.missing_optional_sources.length, 1);
  assert.equal(manifest.outputs.length, 2);
  assert.equal(manifest.artifacts.length, 4);
  for (const file of [manifest.projection, manifest.source_manifest, ...manifest.sources]) {
    assert.equal(file.sha256, sha256(await readFile(file.path)));
  }
  for (const file of [...manifest.generated, ...manifest.artifacts, ...manifest.outputs]) {
    assert.equal(file.sha256, sha256(await readFile(path.join(result.directory, file.path))));
  }
  assert.deepEqual((await loadProjection(f.corpus, f.projection)).ir, before.ir);
});

test("repository-relative documentary paths resolve and Git commit is recorded", async (t) => {
  const f = await fixture(t);
  execFileSync("git", ["init", "-q", f.source]);
  execFileSync("git", ["-C", f.source, "add", "."]);
  execFileSync("git", ["-C", f.source, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "Fixture"]);
  const project = path.join(f.source, "projects/book");
  await mkdir(project, { recursive: true });
  const corpus = path.join(project, "corpus.yml");
  await writeFile(corpus, "sources:\n  - path: manuscript/00-opening.md\n    required: true\n");
  await writeFile(f.projection, stringify({ ...exampleContract, source_manifest: "../projects/book/corpus.yml" }));
  const result = await render({ ...f, corpus, quarto: await fakeQuarto(f.root) });
  assert.equal(result.manifest.source_git_commit, execFileSync("git", ["-C", f.source, "rev-parse", "HEAD"], { encoding: "utf8" }).trim());
  assert.equal(result.manifest.source_git_dirty, true);
});

test("missing mandatory documentary source and missing chapter have explicit diagnostics", async (t) => {
  const f = await fixture(t);
  await rm(path.join(f.source, "manuscript/00-opening.md"));
  await assert.rejects(loadProjection(f.corpus, f.projection), /Cannot read required source.*00-opening/);
  await writeFile(f.corpus, "sources: []\n");
  await assert.rejects(loadProjection(f.corpus, f.projection), /Cannot read required source.*00-opening/);
});

test("mismatched corpus and broken frontmatter fail before rendering", async (t) => {
  const f = await fixture(t);
  const other = path.join(f.source, "other.yml");
  await cp(f.corpus, other);
  await assert.rejects(loadProjection(other, f.projection), /does not match/);
  await writeFile(path.join(f.source, "manuscript/00-opening.md"), "# Missing frontmatter\n");
  await assert.rejects(loadProjection(f.corpus, f.projection), /frontmatter/);
});

test("Quarto absent gives a clean diagnostic without producing a build", async (t) => {
  const f = await fixture(t);
  await assert.rejects(render({ ...f, quarto: createQuartoAdapter({ executable: path.join(f.root, "no-quarto") }) }), /Quarto executable not found.*Install Quarto/);
  await assert.rejects(access(f.output));
});

for (const mode of ["failure", "missing-pdf", "invalid-pdf"]) {
  test(`failed renderer (${mode}) leaves no success manifest or partial edition`, async (t) => {
    const f = await fixture(t);
    await assert.rejects(render({ ...f, quarto: await fakeQuarto(f.root, mode) }), /TeX unavailable|required pdf|Invalid pdf/);
    await assert.rejects(access(f.output));
  });
}

test("existing outputs, source directories and symlink aliases cannot be overwritten", async (t) => {
  const f = await fixture(t);
  const quarto = await fakeQuarto(f.root);
  await mkdir(f.output);
  await writeFile(path.join(f.output, "sentinel"), "keep");
  await assert.rejects(render({ ...f, quarto }), /EEXIST/);
  assert.equal(await readFile(path.join(f.output, "sentinel"), "utf8"), "keep");
  await assert.rejects(render({ ...f, output: path.join(f.source, "edition"), quarto }), /outside every source/);
  const alias = path.join(f.root, "alias");
  await symlink(f.source, alias, "dir");
  await assert.rejects(render({ ...f, output: path.join(alias, "edition"), quarto }), /outside every source/);
});

test("input mutation during rendering invalidates the build", async (t) => {
  const f = await fixture(t);
  const base = await fakeQuarto(f.root);
  await assert.rejects(render({ ...f, quarto: { version: base.version, async render(...args) {
    await base.render(...args);
    await writeFile(f.corpus, "sources: []\n");
  } } }), /Source changed during render/);
  await assert.rejects(access(f.output));
});

test("CLI help, invalid options and missing inputs return concise diagnostics", () => {
  const cli = path.join(repo, "cli/render.js");
  assert.equal(spawnSync(process.execPath, [cli, "--help"]).status, 0);
  for (const args of [[], ["--unknown"], ["--corpus"]]) {
    const result = spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /ubikia render:/);
    assert.doesNotMatch(result.stderr, /at file:/);
  }
});

const neighbor = path.resolve(process.env.UBIKIA_TEST_SUICIDE_CORSE
  ?? path.resolve(repo, "../barons-Mariani/projects/suicide-corse"));
let neighborAvailable = true;
try {
  await access(path.join(neighbor, "projections/book.yml"));
} catch (error) {
  if (process.env.UBIKIA_TEST_SUICIDE_CORSE) throw error;
  neighborAvailable = false;
}

test("neighbor Suicide Corse contract integration", {
  skip: neighborAvailable ? false : "Neighbor Suicide Corse project absent; faithful synthetic fixture exercised above",
}, async (t) => {
  const f = await fixture(t);
  const options = { corpus: path.join(neighbor, "corpus.yml"), projection: path.join(neighbor, "projections/book.yml") };
  const { ir } = await loadProjection(options.corpus, options.projection);
  assert.equal(ir.editionId, "suicide-corse-numero-0");
  assert.equal(ir.chapters.length, 5);
  const result = await render({ ...options, output: f.output, quarto: await fakeQuarto(f.root) });
  assert.equal(result.manifest.outputs.length, 2);
});

test("real Quarto HTML/PDF integration (fixture or available Suicide Corse)", {
  skip: process.env.UBIKIA_TEST_QUARTO === "1" ? false : "Set UBIKIA_TEST_QUARTO=1 with Quarto and TeX installed",
}, async (t) => {
  const f = await fixture(t);
  const options = neighborAvailable ? { corpus: path.join(neighbor, "corpus.yml"), projection: path.join(neighbor, "projections/book.yml") } : f;
  const result = await render({ ...options, output: f.output });
  assert.equal(result.manifest.outputs.length, 2);
  const html = await readFile(path.join(f.output, "_book/index.html"), "utf8");
  assert.match(html, neighborAvailable ? /Suicide Corse/ : /Minimal reactive book/);
  assert.notEqual(result.manifest.renderer.version, "test-double-1");
});
