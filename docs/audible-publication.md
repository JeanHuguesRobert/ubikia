# Publication strategy for audible derived products

## Status

This document separates production from publication.

Ubikia prepares the audible product, publication package, metadata, provenance, and publication record. The `inseme` platform layer will eventually provide durable storage, public URLs, job execution, secrets, deployment, and service integration.

No publication is automatic in this first phase.

## Publication objects

An audible publication should not be reduced to one MP3 file. The publication package should include:

- the normalized MP3 as the broad-compatibility distribution file;
- optionally an Opus version for efficient direct web delivery;
- the written source URL;
- the source repository, path, and commit when known;
- the readable transcript or prepared oral text;
- title, subtitle, summary, author, language, date, artwork, and duration;
- a disclosure that the article is read by a synthetic custom voice when applicable;
- the audio SHA-256 and MIME type;
- publication targets and their resulting URLs;
- feedback and corrections returned to the source corpus.

## Recommended publication architecture

```text
Ubikia source and derivation
  -> audio segments
  -> normalized publication files
  -> publication package
  -> durable media hosting in inseme/platform
  -> canonical episode page and RSS feed
  -> platform syndication
       - Substack
       - Apple Podcasts
       - Spotify
       - YouTube / YouTube Music
       - open podcast clients
```

The durable media URL and RSS feed should be canonical. Platform entries should point back to the written source and canonical episode page when the platform permits it.

## Phase 1 — manual attachment to the existing article

For the current experiment:

1. assemble and review the MP3;
2. upload or attach it manually to the existing Substack publication if the current editor permits audio insertion;
3. add a short disclosure and link to the written source;
4. record the publication URL and date in Ubikia;
5. do not yet create a separate podcast series unless the audible experiment is judged useful.

This phase tests the product without prematurely defining a complete podcast identity.

## Phase 2 — canonical Ubikia audio page

The platform should expose a stable page for each audible product with:

- an HTML5 audio player;
- MP3 and optional Opus URLs;
- transcript;
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

## Phase 4 — directory syndication

Submit the canonical RSS feed to podcast directories and platforms. Directory submission is a publication action and remains human-authorized.

The open RSS feed preserves portability. Platform-specific features may be added, but they must not become the only copy of the publication record or media.

## Publication states

Suggested lifecycle:

```text
draft
  -> rendered
  -> assembled
  -> reviewed
  -> publication_ready
  -> published
  -> superseded | withdrawn
```

`assembled` does not imply `reviewed`. `reviewed` does not imply `published`.

## Next implementation files

```text
src/audible/publication-package.js
schemas/audible-publication.schema.json
cli/audible-package.js
```

Later, in `inseme/platform`:

```text
media storage adapter
stable public URL service
publication job and status store
RSS endpoint
target-platform connectors
```
