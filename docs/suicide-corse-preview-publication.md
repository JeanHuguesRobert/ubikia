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
requires HTML and PDF outputs, requires `publication_status: draft`, checks that
the manifest's source commit is the checked-out `barons-Mariani` HEAD, and
copies only `_book/` plus `manifest.json` into
`suicide-corse/editions/2026-09-17/`. The landing page, `CNAME`, and
`temoigner.html` are outside its write target.

Directory replacement is staged beside the release and renamed only after
validation. A temporary previous-directory backup permits restoration if that
rename fails. The build directory is disposable and is removed at exit.

## Boundaries

`--push` is an explicit operator action. A successful push may cause GitHub
Pages to deploy, but neither GitHub Pages propagation nor public reachability is
claimed by this script. Verify the public URL separately with the Operium smoke
check after GitHub Pages has completed.

The final frozen edition is outside this procedure. It requires a separately
identified source snapshot and explicit editorial/publication authorization.
