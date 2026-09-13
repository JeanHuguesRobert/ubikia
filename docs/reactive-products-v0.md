---
title: Reactive Products v0
language: en
document_role: "operational"
document_kind: implementation-guide
status: working
update_policy: UP-DEFAULT-REVIEWED
source_issue: https://github.com/JeanHuguesRobert/ubikia/issues/24#issuecomment-5574399111
visibility: "public"
lifecycle_state: "working"
classification_source: "cogentia.js"
classification_version: "1"
classification_rule: "explicit-metadata"
classification_confidence: "medium"
legacy_document_role: "technical"
---

# Reactive Products v0

`npm run render` projects a canonical Markdown corpus into a disposable Quarto
book, HTML/PDF and a JSON provenance manifest. It creates a local draft, never a
publication or a reviewed edition. No AI service, persona or content rewriting
is involved. Documentary wording and chapter order remain intact.

## Run

Requires Node 20+, `npm ci`, Quarto on PATH and a TeX distribution for PDF.
The only npm dependency is the pinned `yaml` parser: the actual contract and
chapter frontmatter contain nested mappings/sequences, for which a handwritten
subset parser would risk silently losing provenance.

```sh
npm run render -- \
  --corpus ../barons-Mariani/projects/suicide-corse/corpus.yml \
  --projection ../barons-Mariani/projects/suicide-corse/projections/book.yml
```

Independent synthetic example, using the same contract shape and five chapters:

```sh
npm run render -- \
  --corpus examples/reactive-products/corpus.yml \
  --projection examples/reactive-products/projections/book.yml
```

The CLI prints the output directory, manifest path and output hashes. By default
it creates a fresh directory under the operating system's temporary directory.
Copy a completed build elsewhere if it must survive temporary-file cleanup.
`--output /existing/parent/new-edition` chooses an explicit new directory; its
parent must already exist. Existing destinations are never overwritten. Outputs
must be outside all input repositories (or source directories for non-Git
inputs), including symlink aliases. This also means an example stored in Ubikia
must be rendered outside the Ubikia checkout.

API:

```js
import { render } from "../src/reactive-products/render.js";
const { directory, manifest } = await render({
  corpus: "/corpus/projects/book/corpus.yml",
  projection: "/corpus/projects/book/projections/book.yml",
});
```

## Input contract and path rules

[Projection schema](../schemas/projection-book-v0.schema.json) is JSON Schema
2020-12; runtime validation implements its small supported subset directly.
The native schema identifier is `ubikia.projection.book.v0`; the existing
`suicide-corse.projection.book.v0` identifier is accepted without migration.

Required fields: `schema`, `id`, `title`, `language`, `source_manifest`, a
nonempty ordered `chapters` array and `outputs.required` (`html`, `pdf`, or
both). `id` contains only letters, digits, underscores and hyphens and starts
with a letter or digit (e.g. `suicide-corse-numero-0` or `SC-2026-W36`).
Optional metadata: `subtitle`, `author`, `medium` (string, default `book`),
`previous_edition_id` (string, chaining snapshots), `parent_edition_id` (string).
Additional contract metadata, including status, review, provenance requirements
and open questions, is retained in the manifest; it is not treated as Quarto
configuration or evidence of review. Conflicting `render_contract` invariants
fail explicitly. Optional output requests such as EPUB are recorded but not
rendered in v0. Unsupported required outputs fail.

- `source_manifest` and chapter paths resolve relative to the projection file.
  The explicit `--corpus` must resolve to that same manifest.
- Documentary `sources[].path` entries resolve relative to the corpus Git root,
  matching Suicide Corse. For a non-Git corpus the default is the manifest's
  directory. Optional `source_root` overrides that base relative to the manifest
  and makes standalone archives/examples unambiguous.
- Every source is required unless `required: false`; missing optional files
  are listed explicitly. Required sources are validated even if they are not
  chapters. Only `chapters` supplies editorial content/order.
- Chapters are `.md` files with YAML frontmatter. BOM and CRLF are normalized;
  the remaining body is preserved. Duplicate resolved chapter paths fail.

## Generated book and manifest

The first chapter becomes `index.qmd`, followed by numbered QMD files.
`_quarto.yml` uses Quarto's [book backend](https://quarto.org/docs/reference/projects/books.html).
Canonical frontmatter is nested under `ubikia_source` in each QMD file and
retained in `manifest.chapters`, preventing source metadata from becoming
renderer directives. Code execution is disabled and renders use `--no-execute`.
Inputs must still be trusted Markdown; this is not a sandbox for arbitrary raw
HTML/TeX or Quarto directives.

The directory contains disposable QMD/configuration, `_book/index.html`, other
HTML chapters/assets, `_book/<edition-id>.pdf`, and `manifest.json`. QMD is
retained for inspection and may be deleted after inspecting a build. The
manifest is written only after required outputs exist, have plausible HTML/PDF
signatures and all inputs still match their captured hashes. A failed build's
new output directory is removed; existing editions are never touched.

`ubikia.reactive-build.v0` records edition ID, build timestamp, full projection
contract and its SHA-256, corpus manifest hash, all present documentary/chapter
source hashes and absolute paths, Git HEAD (null when unavailable), per-source
commits, working-tree dirty status, renderer version, generator version,
frontmatter, missing optional sources, required outputs and hashes of every
rendered artifact (including HTML support files). Output paths are relative to
the build directory. Source hashes describe actual bytes, including uncommitted
changes; a Git HEAD alone is never claimed to identify dirty source content.

## Validation and limits

```sh
npm test
npm run test:reactive-products
UBIKIA_TEST_QUARTO=1 npm run test:reactive-products
# Optional independent source snapshot (the existing neighbor remains untouched):
UBIKIA_TEST_SUICIDE_CORSE=/path/to/snapshot/projects/suicide-corse \
  UBIKIA_TEST_QUARTO=1 npm run test:reactive-products
git diff --check
```

The default tests use a clearly identified subprocess double to exercise
Quarto argv, working directory, output discovery/hashes, failure cleanup and
missing-executable diagnostics. They do not establish real Quarto/TeX rendering.
The neighbor test automatically reads Suicide Corse if its local project exists;
otherwise it explicitly skips and the synthetic fixture supplies equivalent
structural coverage. `UBIKIA_TEST_SUICIDE_CORSE` selects an independent checkout;
a missing explicitly selected project fails instead of silently skipping. `UBIKIA_TEST_QUARTO=1` enables actual HTML/PDF rendering of
the neighbor when present, or the fixture otherwise; missing Quarto/TeX then
fails rather than silently skipping.

Current environment validation (2026-09-07): Quarto was not installed and the
neighbor checkout lacked `projects/suicide-corse`. The real renderer and real
neighbor tests therefore remain explicit environment-dependent checks.

V0 is a text-first book slice. Local linked assets, relative link rewriting,
chapter-to-chapter Markdown links, bibliography/citation configuration, cover
rights, print geometry, author arrays, EPUB and manifest-driven replay are not
implemented. Use self-contained Markdown prose with headings for this slice.
No timestamp is injected into editorial content; QMD/configuration is stable
for identical inputs at the same paths. Quarto/TeX versions, fonts, system
packages and PDF metadata can still change final bytes. Pin the environment,
retain original source bytes and compare manifest hashes to diagnose differences;
v0 does not promise byte-identical PDF builds or archive dirty source snapshots.

Continuation for later work: define asset/citation resolution only when a real
chapter requires it, and define an archival replay contract when exact build
reproduction becomes a requirement. These are outside #24's initial slice.
