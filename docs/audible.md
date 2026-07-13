# Audible derived products

## Scope

Ubikia produces governed audible derived products from written sources while preserving the distinction between source, spoken adaptation, TTS input, audio assets, target-specific media, and publication records.

Database services, scheduling, durable job state, shared secret management, media hosting, and deployment remain responsibilities of the `inseme` platform layer.

## Pipeline

```text
written source
  -> spoken adaptation workspace
  -> spoken draft
  -> explicit review act
  -> reviewed spoken product
  -> TTS preparation
  -> bounded text segments
  -> resumable Gradium rendering
  -> WAV assembly
  -> normalized MP3 and Opus
  -> static-artwork YouTube MP4
  -> YouTube publication package
  -> manual private upload
  -> human publication decision
```

## Environment

Copy `.env.example` to `.env` and set:

```dotenv
GRADIUM_API_KEY=...
GRADIUM_VOICE_ID=...
```

After FFmpeg is installed, either place `ffmpeg` and `ffprobe` on `PATH` or set:

```dotenv
FFMPEG_PATH=C:\path\to\ffmpeg.exe
FFPROBE_PATH=C:\path\to\ffprobe.exe
```

The real `.env` is ignored by Git.

## 1. Create a spoken adaptation workspace

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

The generated `spoken.draft.md` is a mechanical baseline. It is not a reviewed adaptation.

## 2. Adapt the spoken draft

Give `adaptation-request.md` and `source.md` to a human editor or governed agent. The adapted result remains `spoken.draft.md` until an explicit review act is recorded.

## 3. Record the review

Copy and edit the generic review input:

```powershell
Copy-Item `
  examples\audible\review.example.json `
  artifacts\audible\episode-slug\review-input.json
```

Then run:

```powershell
npm run audible:review -- `
  artifacts\audible\episode-slug `
  artifacts\audible\episode-slug\review-input.json
```

This creates `spoken.reviewed.md` and `review.json`, then changes `adaptation.json` to `status: reviewed`.

See [`audible-adaptation.md`](audible-adaptation.md).

## 4. Render the reviewed spoken product

```powershell
npm run audible:render -- `
  artifacts\audible\episode-slug\source.md `
  artifacts\audible\episode-slug `
  artifacts\audible\episode-slug\spoken.reviewed.md
```

The rendering process is resumable. Existing segments are reused only when the segment text hash, voice, and output format match.

The audio manifest records separate hashes for:

- the written source;
- the spoken adaptation;
- the prepared TTS text;
- each segment text;
- each segment audio file.

## 5. Assemble and normalize audio

```powershell
npm run audible:assemble -- artifacts\audible\episode-slug
```

Expected products include:

```text
episode-slug.wav
episode-slug.mp3
episode-slug.opus
segments.ffconcat
manifest.json
```

Assembly follows only the segment list declared in the current manifest, preventing stale segment files from an older adaptation from entering the final audio.

The MP3 is encoded for broad compatibility. The Opus file is suitable for efficient direct delivery. Both are described in the manifest with size, duration when available, and SHA-256.

## 6. Create a YouTube video asset

Prepare a landscape artwork image, then run:

```powershell
npm run audible:video -- `
  artifacts\audible\episode-slug `
  artwork\episode-slug.png `
  episode-slug
```

The command creates a 1920×1080, 30 fps H.264/AAC MP4 from the static artwork and assembled audio, then records the video asset in `manifest.json`.

## 7. Create a YouTube publication package

Copy and edit the generic metadata example:

```powershell
Copy-Item `
  examples\audible\youtube.metadata.example.json `
  artifacts\audible\episode-slug\youtube.metadata.json
```

Then run:

```powershell
npm run audible:package:youtube -- `
  artifacts\audible\episode-slug `
  artifacts\audible\episode-slug\youtube.metadata.json
```

Generated files:

```text
youtube-package.json
youtube-title.txt
youtube-description.md
```

The command requires a reviewed spoken transcript by default. A development-only override may be requested through metadata, and remains visible in the generated package.

The package remains a draft with private visibility and `not_uploaded` status until manually uploaded and reviewed.

See [`audible-youtube.md`](audible-youtube.md).

## Commands

```text
npm run audible:adapt
npm run audible:review
npm run audible:render
npm run audible:assemble
npm run audible:video
npm run audible:package:youtube
npm run audible:test
```

## Current boundaries

Implemented:

- provider-neutral adaptation workspace;
- adaptation prompt and mechanical checks;
- explicit spoken review act and `review.json`;
- source/spoken/prepared-text provenance;
- resumable Gradium TTS;
- safe segment reuse by text hash;
- manifest-controlled FFmpeg assembly and normalization;
- static YouTube MP4 generation;
- generic YouTube metadata package;
- schemas for adaptation, review, and YouTube products.

Not yet implemented:

- semantic adaptation by a configured LLM provider;
- semantic review agent;
- pronunciation dictionaries;
- sentence-level timing and subtitle generation;
- artwork generation or templates;
- direct YouTube upload;
- publication records and connector reconciliation;
- canonical hosting and RSS;
- database, queues, storage services, scheduling, or deployment;
- interactive onboarding agent.

These limits must remain visible rather than being hidden behind automatic publication.

## Future onboarding

Ubikia is intended for multiple authors and organizations. Static documentation will remain available, but a future onboarding agent may guide users through prerequisites, adaptation, review, rendering, packaging, and publication checkpoints.

See [`audible-onboarding-agent.md`](audible-onboarding-agent.md).
