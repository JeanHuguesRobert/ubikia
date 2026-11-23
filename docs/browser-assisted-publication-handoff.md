---
document_role: operational
document_kind: documentation
visibility: public
lifecycle_state: active
language: en
date: "2026-11-23"
last_modified_at: "2026-11-23"
license: CC BY-SA 4.0
affiliation: Institut Mariani / C.O.R.S.I.C.A., 1 cours Paoli, F-20250 Corte, Corsica
update_policy: UP-DEFAULT-REVIEWED
---

# Browser-assisted publication handoff: Ubikia → Cogentia Navigation Assistant

Owning packet: [Ubikia #45](https://github.com/JeanHuguesRobert/ubikia/issues/45).

This extends the existing audible YouTube pipeline. It is **not** a second media renderer, browser implementation or publication ledger. Ubikia prepares a deterministic reviewable handoff; Cogentia supplies the authorized page/form/browser effects; the existing Ubikia ledger retains verified publication memory.

## Before handoff

Finish the existing Ubikia steps: finalize spoken review, render audio, create video and generate the YouTube package. A prepared package must contain:

- manifest.json, youtube-package.json, review.json, spoken.reviewed.md;
- the actual .mp4 referenced by both manifest and package;
- nonempty title and description;
- a pinned source repository/path/40-digit commit supplied by the responsible project;
- an existing upload account session on the correct hosted browser.

An incomplete, unreviewed, missing or altered package is refused. The CLI hashes the actual MP4 and reviewed transcript; checks their hashes against recorded manifests; and checks the publication ledger for a matching previously published video hash. The review source commit is recorded but not independently fetched or cryptographically verified by the CLI. A separate Git source preflight establishes that provenance if needed.

## Prepare the handoff without remote effects

Use an exact URL *observed in the current YouTube Studio browser session*, not a guessed uploader URL:

    node cli/browser-publication-handoff.js \
      --artifact artifacts/audible/your-reviewed-episode \
      --expected-url 'https://studio.youtube.com/<actual-current-page>' \
      --source-repo JeanHuguesRobert/barons-Mariani \
      --source-path publications/<actual-source>.md \
      --source-commit <40-character-source-commit> \
      --ledger publications/ledger/publications.json

The command prints a JSON handoff with status prepared_for_dom_binding_and_act_specific_approval. It does not open the browser, upload bytes, create a platform draft, change visibility, write a ledger entry or send a message. To persist a copy of the output for review, redirect it to an explicitly selected private artifact location. **Do not check absolute local file paths into a public repo.**

The file path in the handoff is the **planner host** path. If the prepared MP4 lives on the ThinkPad but the browser is hosted on Fracta2, stage the reviewed media on Fracta2 and recheck its SHA-256 and browser access there. Do not send Windows paths to a Linux CDP file selection. Access permissions must permit the hosted browser Unix identity to read the file.

## Guided browser stage

1. Verify the authenticated account/channel, tab identity and exact current URL using the Navigation Assistant. If the URL changes, return to the handoff source and review it.
2. Inspect the actual DOM and bind the title, description, file input and any other required platform controls. There are deliberately **no stored field indexes**, because platform forms change.
3. Apply browser.form.fill only under its existing COP form mandate, with contenteditable where appropriate.
4. For browser.form.upload, independently request the standing COP selection authority on the exact file path, URL and tab. A successful FileList read proves selection and access; it is **not proof that the platform uploaded or published** the file.
5. Collect the platform-specific processing state and immutable video ID/URL. A separate, explicit, specific publishing decision is still needed before changing public visibility or submitting anything that engages the publisher.

The prepare-only plan never confers authority or calls John. The browser agent binds the proposed operations to live, verified page fields at execution time and produces its own COP receipts.

## After an observed publication

Only after independent platform evidence and human confirmation, use the **existing** Ubikia recording path:

    npm run audible:record:youtube -- \
      artifacts/audible/your-reviewed-episode \
      https://youtu.be/<verified-video-id> \
      <observed-visibility> \
      '<responsible-actor>' \
      <actual-published-at>

This populates publication.youtube.json and publications/ledger/publications.json through their established schemas. The record command currently classifies provider verification as not_performed unless a separate verifier supplies evidence; do not convert a browser file-selection receipt into a claim of remote publication. Review the resulting ledger entry, publication URL, visibility and provenance against the platform receipt before committing.

## Historical reality probe

The previously published Marche du Soleil video is in publications/ledger/publications.json as youtube:zWxGO7Vh1s4, with its 22 November 2026 provenance, platform verification and video SHA-256. The actual MP4, manifest and reviewed transcript remain under C:\tweesic\ubikia\artifacts\audible\marche-du-soleil-2026-11-21 on the ThinkPad.

A fresh handoff of that existing package must fail with PACKAGE_NOT_PREPUBLICATION because it is already marked published. Reading its ledger evidence is a **read-only replay**, not another network verification or permission to upload twice. New publications should be piloted with a freshly reviewed package.

## Validation

    npm test

The suite verifies hash mismatch rejection, prior-publication detection, review enforcement, exact Studio origin binding, refusal of unsafe file paths, the CLI prepare-only boundary, Windows-style absolute cover paths and read-only ledger replay. The first live publication through this new handoff awaits a separately authorized **specific content and destination**, not another infrastructure feature.
