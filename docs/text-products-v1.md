---
title: "Ubikia text products — source-preserving builds"
language: en
document_role: operational
document_kind: implementation-guide
status: working
update_policy: UP-DEFAULT-REVIEWED
visibility: public
date: "2026-10-08"
---

# Text products v1

Generic, non-publishing Markdown composition from Git-committed sources. This is an additive primitive, separate from `filing-package` (PDF) and `reactive-products` (Quarto).

## Usage

From a Ubikia checkout with `npm ci` performed, and independently checked-out source repositories:

```sh
node cli/text-product.js \
  --contract /path/to/barons-Mariani/research/senatoriales-2026/build/provenance-email.ubikia.yaml \
  --checkout JeanHuguesRobert/barons-Mariani=/absolute/path/to/barons-Mariani \
  --output /tmp/cc-provenance-email.md
```

The source checkout must have the named exact commits available locally; the builder does not fetch from the network. The output directory may be created, but an existing output file is never overwritten. The companion `.md.manifest.json` records SHA-256 of each source and final output, immutable and living GitHub URLs, byte counts, and `draft-not-sent` status.

For each `github-verbatim` section, the builder reads the exact Git blob via `git show COMMIT:PATH`; uncommitted worktree edits do not affect input. Sections are joined with two newlines; each source section is otherwise decoded faithfully from UTF-8. For exact byte-for-byte cross-output comparison, compare the generated Markdown file bytes with the Gmail draft body extracted as UTF-8 after normalizing transport encoding; Gmail must be created as a separate, reviewable effect.

## Boundaries

This program never sends emails, uploads documents, declares receipt, or writes to source repositories. It does not evaluate Markdown or run commands contained in documents. It requires an explicitly declared checkout mapping, verifies its Git origin, refuses path traversal and missing refs, and emits a traceable local artifact.

The `github-verbatim` operation is specific to Git-backed sources, but composition is generic. The legal filing manifest is one application, not part of the builder code.

## Validation

```sh
npm ci
node --test test/text-product.test.js
```

CI: `.github/workflows/text-product-tests.yml`.

The integration with `inseme` issue 120 `compute.batch` is **not implemented** here. Its currently permitted computation kinds remain `sha256-file` and `node-test`. A later generic execution binding should authorize an identified Ubikia program and artifact return without exposing arbitrary shell from GitHub issue comments.
