---
title: Suicide Corse preview publication procedure
language: en
document_role: operational
document_kind: publication-support
status: working
update_policy: UP-DEFAULT-REVIEWED
visibility: public
lifecycle_state: working
date: '2026-09-17'
review:
  status: unreviewed
  reviewed_by: []
provenance:
  origin_type: repository
  origin_repository: JeanHuguesRobert/ubikia
  origin_ref: issue-31
  origin_date: '2026-09-17'
  derived_from:
    - https://github.com/JeanHuguesRobert/ubikia/issues/31
---

# Suicide Corse preview publication procedure

`scripts/publish-suicide-corse-preview.sh` is a deliberately bounded operator
procedure for rendering and staging the 2026-09-17 Suicide Corse preview. It
does not alter editorial source material and it does not treat a successful
render as a final edition.

## Prerequisites

Run on a POSIX host with sibling, clean Git checkouts of `ubikia`,
`barons-Mariani`, and `suicide-corse`; Node 20+, installed Ubikia dependencies,
Quarto, and a working TeX distribution are also required. The default paths can
be overridden with `UBIKIA_DIR`, `BARONS_MARIANI_DIR`, and
`SUICIDE_CORSE_SITE_DIR`.

The procedure refuses tracked or untracked work in all three repositories. In
apply mode it first performs `git pull --ff-only` in each checkout, then renders
from the current Corpus revision.

## Modes

```sh
# Render and validate a fresh, disposable preview. No Git state changes.
scripts/publish-suicide-corse-preview.sh --dry-run

# Replace only editions/2026-09-17 locally after a successful render.
scripts/publish-suicide-corse-preview.sh --apply

# After reviewing the displayed artifact-repository diff, make a local commit.
scripts/publish-suicide-corse-preview.sh --apply --commit

# Explicitly request the remote Git push only after the preceding checks.
scripts/publish-suicide-corse-preview.sh --apply --commit --push
```

The script reads the generated manifest rather than assuming a PDF filename. It
requires HTML, PDF, and EPUB outputs, requires `publication_status: draft`, checks that
the manifest's source commit is the checked-out `barons-Mariani` HEAD, and
copies `_book/` plus `manifest.json` into `suicide-corse/editions/2026-09-17/`.
It also derives `questions-ouvertes.html` from the canonical Corpus file
`projects/suicide-corse/manuscript/questions-ouvertes.md`, verifies that the
embedded source commit matches the same `barons-Mariani` revision as the book
manifest, and stages that page at the publication root. The landing page,
`CNAME`, and `temoigner.html` remain outside the script's write target.

Directory replacement is staged beside the release and renamed only after
validation. A temporary previous-directory backup permits restoration if that
rename fails. The open-questions page follows the same staged replacement
principle. The build directory is disposable and is removed at exit.

## Open questions projection

`scripts/render-suicide-corse-open-questions.mjs` is deliberately narrow. It
reads the canonical Markdown source, strips its frontmatter, renders only the
small Markdown subset currently used by that document, and writes a standalone
HTML page containing the exact source commit in both metadata and visible
provenance. It also links back to `temoigner.html` rather than duplicating the
call-for-testimony content.

The open-questions HTML is a derived product, not a new source. Editorial
changes belong in `barons-Mariani`; rerunning the preview pipeline regenerates
the public projection.

Quarto may emit terminal spaces in generated navigation markup. The artifact
diff gate therefore retains Git conflict diagnostics while excluding only that
generated whitespace class; it does not alter the rendered files.

## Cover contract

When a projection declares `cover`, the generic reactive-product renderer
validates every supplied cover field and requires `preserve_source_image: true`.
It copies the declared PNG byte-for-byte into the disposable build, records its
source SHA-256 in `manifest.json`, uses it as Quarto's EPUB cover image, and
places it as the central graphic on the generated HTML/PDF cover page. The
source image is neither modified nor regenerated.

## Boundaries

`--push` is an explicit operator action. It updates only the artifact Git
repository; it does not deploy the public site. The currently observed serving
topology is a Fracta TLS gateway forwarding over the authenticated mesh to a
Fracta2 static origin. Promotion of the Fracta2 release pointer belongs to
Operium and remains a separate, explicitly authorized action. Verify the public
URL with the Operium smoke check after that promotion.

The final frozen edition is outside this procedure. It requires a separately
identified source snapshot and explicit editorial/publication authorization.
