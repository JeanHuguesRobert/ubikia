# Publication strategy for audible derived products

## Status

This document separates production from publication.

Ubikia prepares the audible product, target-specific assets, metadata, provenance, and publication record. The `inseme` platform layer will eventually provide durable storage, public URLs, job execution, secrets, deployment, and connector integration.

No publication is automatic in this phase.

## Publication objects

An audible publication should not be reduced to one MP3 or MP4 file. The publication package should include:

- the normalized MP3 as a broad-compatibility audio file;
- optionally an Opus version for efficient direct web delivery;
- a target-specific video asset when required;
- the written source URL;
- the source repository, path, and commit when known;
- the reviewed spoken product or readable transcript;
- title, summary, author, language, date, artwork, and duration;
- a synthetic custom-voice disclosure when applicable;
- media SHA-256 hashes and MIME types;
- publication targets and resulting URLs;
- feedback and corrections returned to the source corpus.

## Recommended publication architecture

```text
Ubikia source and derivation
  -> reviewed spoken product
  -> audio segments
  -> normalized publication files
  -> target-specific assets and package
  -> manual publication checkpoint
  -> durable media hosting in inseme/platform
  -> canonical episode page and RSS feed
  -> wider platform syndication
```

The durable media URL and future RSS feed should become canonical. Platform entries should point back to the written source and canonical episode page when the platform permits it.

## Phase 1 — YouTube-first manual pilot

The first practical target is YouTube because it can provide immediate public discovery while accepting a simple static-artwork video derived from the audio edition.

For each pilot episode:

1. create and review the spoken adaptation;
2. render and review the complete audio;
3. assemble normalized MP3 and Opus products;
4. generate a static-artwork MP4;
5. create the YouTube publication package;
6. upload manually as private;
7. review the uploaded result and current platform declarations;
8. change visibility only through a distinct human publication act;
9. record the resulting URL, identifier, date, and metadata;
10. link back to the written source, such as the corresponding Substack article.

The initial series may be presented as the audio edition of an existing written publication, but the underlying data model must remain generic for other authors and series.

## Phase 2 — canonical Ubikia audio page

The platform should expose a stable page for each audible product with:

- an HTML5 audio player;
- MP3 and optional Opus URLs;
- reviewed transcript;
- source and provenance links;
- duration and publication metadata;
- correction and replacement history;
- machine-readable JSON metadata.

The public URL must remain stable even when the underlying audio is regenerated. Replacements should be versioned and auditable.

## Phase 3 — podcast RSS

When several reviewed audible products exist, generate an RSS 2.0 podcast feed with one item per audible product.

Each item should include at least:

- globally stable GUID;
- title and description;
- publication date;
- canonical episode URL;
- enclosure URL, MIME type, and byte length;
- duration;
- explicit-content declaration;
- artwork where appropriate;
- source article URL;
- transcript link when supported.

The feed should be generated from publication records, not inferred by scanning an artifact directory.

## Phase 4 — directory and platform syndication

Submit the canonical feed or target-specific package to relevant directories and platforms. Submission is a publication action and remains human-authorized.

The open feed preserves portability. Platform-specific features may be added, but they must not become the only copy of the publication record, source relationship, or media provenance.

## Publication states

Suggested lifecycle:

```text
source_selected
  -> adaptation_draft
  -> adaptation_reviewed
  -> rendered
  -> assembled
  -> media_reviewed
  -> target_packaged
  -> publication_ready
  -> uploaded_private
  -> published
  -> superseded | withdrawn
```

Important invariants:

```text
adapted does not imply reviewed
assembled does not imply media-reviewed
target-packaged does not imply publication-ready
uploaded does not imply published
```

## Current implementation

```text
src/audible/adapt.js
src/audible/render.js
src/audible/assemble.js
src/audible/video.js
src/audible/package-youtube.js

cli/audible-adapt.js
cli/audible-render.js
cli/audible-assemble.js
cli/audible-video.js
cli/audible-package-youtube.js

schemas/spoken-product.schema.json
schemas/youtube-publication-package.schema.json
```

## Later, in `inseme/platform`

```text
media storage adapter
stable public URL service
publication job and status store
RSS endpoint
target-platform connectors
credential and secret management
resumable upload execution
```

Target-platform policies and UI fields may change. A publication connector or onboarding agent must verify current requirements at execution time rather than treating repository documentation as timeless platform truth.
