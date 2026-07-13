# YouTube-first audible publication workflow

## Scope

This workflow prepares a written source as a spoken edition, renders it with TTS, creates normalized audio, combines it with static artwork, and prepares a manual YouTube upload package.

It does not upload or publish automatically.

## Product model

```text
written source
  -> spoken adaptation
  -> reviewed spoken product
  -> TTS segments
  -> assembled audio
  -> static-artwork MP4
  -> YouTube publication package
  -> manual private upload
  -> human review
  -> publication decision
```

A YouTube episode is a platform appearance of an audible derived product. It is not the canonical source and should point back to the written source or canonical episode page when available.

## 1. Create the adaptation workspace

```powershell
npm run audible:adapt -- `
  ..\source-repository\article.md `
  artifacts\audible\episode-slug
```

This creates:

```text
source.md
spoken.draft.md
adaptation-request.md
adaptation.json
```

Give `adaptation-request.md` and `source.md` to a governed editor or agent. The result remains `spoken.draft.md` until reviewed.

## 2. Review the spoken adaptation

Review at least:

- claims and conclusions;
- negations and modalities;
- names, dates, numbers, and quotations;
- omitted reservations and qualifications;
- new examples or arguments that were not in the source;
- transitions that may imply a different logical relationship;
- pronunciation-sensitive words and abbreviations.

After explicit review, preserve the reviewed text as:

```text
spoken.reviewed.md
```

A later implementation should record the reviewer and review act in `review.json`.

## 3. Render audio from source plus spoken product

```powershell
npm run audible:render -- `
  artifacts\audible\episode-slug\source.md `
  artifacts\audible\episode-slug `
  artifacts\audible\episode-slug\spoken.reviewed.md
```

The manifest records separate hashes for the written source, spoken product, and prepared TTS text.

## 4. Assemble and normalize

```powershell
npm run audible:assemble -- artifacts\audible\episode-slug
```

Expected products include WAV, MP3, and Opus files plus updated provenance metadata.

## 5. Prepare artwork

Create a landscape image suitable for a static-video episode. The initial implementation renders a 1920×1080 MP4 and scales/pads the supplied image without stretching it.

Artwork should normally include:

- series identity;
- episode title or a concise title variant;
- an explicit audio-edition marker when useful;
- legible typography at small sizes;
- no visual claim that the speaker was physically recorded when a synthetic voice is used.

Artwork production is outside the initial CLI. It may later become a template-driven Ubikia derived product.

## 6. Create the YouTube MP4

```powershell
npm run audible:video -- `
  artifacts\audible\episode-slug `
  artwork\episode-slug.png `
  episode-slug
```

The command selects the assembled MP3 when available, combines it with the image, produces an H.264/AAC MP4, and records the video hash in `manifest.json`.

## 7. Prepare metadata

Copy the generic example:

```powershell
Copy-Item `
  examples\audible\youtube.metadata.example.json `
  artifacts\audible\episode-slug\youtube.metadata.json
```

Edit the copied file. Metadata is user-provided rather than hard-coded because Ubikia is intended for multiple authors, languages, channels, series, and disclosure policies.

## 8. Create the publication package

```powershell
npm run audible:package:youtube -- `
  artifacts\audible\episode-slug `
  artifacts\audible\episode-slug\youtube.metadata.json
```

This creates:

```text
youtube-package.json
youtube-title.txt
youtube-description.md
```

The package defaults to:

```text
status: draft
visibility: private
upload_status: not_uploaded
human_review_required: true
```

## 9. Manual upload checkpoint

The recommended first upload is private. Check:

- the complete episode from beginning to end;
- audio gaps, duplicated segments, and abrupt transitions;
- title and description;
- source links;
- transcript or captions;
- artwork readability;
- synthetic-voice disclosure;
- current platform disclosure and audience settings;
- copyright and privacy concerns.

Only a distinct human publication act should change visibility to unlisted or public.

## 10. Publication record

After publication, record at least:

- platform video identifier;
- public or unlisted URL;
- publication date;
- final visibility;
- uploaded video SHA-256;
- title and description actually used;
- playlist or podcast association;
- corrections, replacement, withdrawal, or supersession history.

This publication-record step is not implemented yet. Durable target credentials, upload jobs, and connector execution belong to the Inseme platform layer.
