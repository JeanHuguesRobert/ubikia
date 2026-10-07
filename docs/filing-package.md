---
title: "Filing Package — immutable legal PDF assembly and release"
author: "Jean Hugues Noël Robert, baron Mariani"
affiliation: "Institut Mariani / C.O.R.S.I.C.A., 1 cours Paoli, F-20250 Corte, Corsica"
date: "2026-10-07"
last_modified_at: "2026-10-07"
version: "0.2"
status: "working — operational implementation"
language: "en"
license: "CC BY-SA 4.0"
document_role: "operational"
document_kind: "implementation-guide"
visibility: "public"
lifecycle_state: "working"
update_policy: "UP-DEFAULT-REVIEWED"
canonical_url: "https://github.com/JeanHuguesRobert/ubikia/blob/main/docs/filing-package.md"
provenance:
  origin_type: "conversation"
  origin_repository: "JeanHuguesRobert/ubikia"
  origin_ref: "unknown"
  origin_date: "2026-10-07"
  derived_from:
    - "docs/reactive-products-v0.md"
review:
  status: "unreviewed"
  reviewed_by: []
---

# Filing Package

This layer assembles a legally filed PDF without versioning intermediate binary renders in Git.

Core invariant:

```text
version sources and assembly contract
→ build disposable candidates outside Git
→ validate one candidate
→ if the artifact is publishable and a release is configured:
     create and verify one draft GitHub Release asset
     → publish only by a separate explicit act
     → immutable Release becomes the durable public object
→ otherwise:
     keep the validated artifact local / privately transmitted
     → preserve its SHA-256 and filing trace without public release
```

A filing contract describes **one artifact**. The `release` block is optional. Its absence means that the contract is deliberately **local-only** and cannot be frozen or published through GitHub Release.

This distinction is required when a filing artifact contains confidential, personal, privileged, or otherwise non-public material. A public/redacted edition should use a **separate contract and a separate artifact**, with its own SHA-256 and, when authorized, its own Release. Private material does not become publishable merely because it was assembled by Ubikia.

The contract is a source-side YAML file. It orders Markdown and already-materialized PDF inputs. Missing required paths are blockers: the planner never invents evidence or treats a bordereau entry as a materialized exhibit.

## Commands

```sh
npm run filing-package -- plan --contract /path/to/filing-package.yml
npm run filing-package -- build --contract /path/to/filing-package.yml --output /outside/repo/build
npm run filing-package -- freeze --contract /path/to/filing-package.yml --build /outside/repo/build
npm run filing-package -- freeze --contract /path/to/filing-package.yml --build /outside/repo/build --apply
npm run filing-package -- publish --contract /path/to/filing-package.yml
npm run filing-package -- publish --contract /path/to/filing-package.yml --apply
```

`freeze` and `publish` are dry-run by default. `freeze --apply` creates a **draft** Release, uploads the single PDF, downloads it again and requires SHA-256 equality. It does not publish. `publish --apply` is deliberately separate because publication is the immutable-release boundary.

Build requires Quarto + a TeX distribution with `pdfpages`. Release operations require GitHub CLI `gh` authenticated for the target repository.

A filing contract should keep `source_clean_required: true` for final builds. The generated manifest records the exact source commit and per-input SHA-256 values. Working candidates remain local and disposable.

## Local-only versus publishable artifacts

Example local-only contract:

```yaml
schema: ubikia.filing-package.v0
id: confidential-filing
title: Confidential filing
source_root: .
source_clean_required: true
artifact:
  filename: confidential-filing.pdf
sections:
  # ...
```

There is intentionally no `release` block. `plan` and `build` remain available; `freeze` and `publish` fail explicitly.

A public projection is a different contract:

```yaml
schema: ubikia.filing-package.v0
id: public-redacted-edition
title: Public redacted edition
source_root: .
source_clean_required: true
artifact:
  filename: public-redacted-edition.pdf
release:
  repository: owner/repo
  tag: public-redacted-edition
  title: Public redacted edition
  immutable_required: true
sections:
  # only public or properly redacted material
```

Canonical rule:

```text
complete filing artifact
≠ public projection

same source lineage
→ distinct assembly contracts
→ distinct artifacts
→ distinct SHA-256 values
→ publication rights evaluated independently
```
