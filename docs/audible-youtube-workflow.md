# Governed audible publication to YouTube

This workflow turns a versioned written source into a reviewed audio edition, a YouTube-ready video, and a recorded publication result.

## Invariants

- The written source remains authoritative.
- A reviewed spoken transcript is required before rendering and packaging.
- Public publication is never performed automatically by this workflow.
- The human publisher chooses the final YouTube settings and performs the upload.
- The resulting URL is recorded afterwards as human-confirmed evidence.
- Remote publication verification is distinct from human confirmation and is not implied.
- `audible:finalize` stages spoken/source inputs from memory so approved files that live inside the output directory are not replaced by a mechanical draft.

## Reference episode

The first reproducible reference project lives at:

```text
examples/audible/le-pere-noel-revient/
```

It pins the article **« Le Père Noël revient — et cette fois, il aide les adultes »** from `JeanHuguesRobert/barons-Mariani` at commit `f1e9057696f26b49e9e97a9bbaa67b59d5954f65`, with persona **Babbu Natale**, French YouTube metadata defaulting to **private** and `madeForKids: false`, and an explicit human-review template.

See [`examples/audible/le-pere-noel-revient/RUNBOOK.md`](../examples/audible/le-pere-noel-revient/RUNBOOK.md) for dry-run and real local run commands (PowerShell and POSIX).

Validate without TTS credentials:

```powershell
npm run audible:validate:reference -- examples\audible\le-pere-noel-revient
npm test
```

## 0. Optional pronunciation audition

Before full TTS generation, render or prepare a short pronunciation sample:

```powershell
# Prepare only (no Gradium call)
npm run audible:audition:prepare -- `
  examples\audible\le-pere-noel-revient\pronunciation-audition.txt `
  artifacts\audible\le-pere-noel-revient\audition

# Real short render (requires Gradium credentials)
npm run audible:audition -- `
  examples\audible\le-pere-noel-revient\pronunciation-audition.txt `
  artifacts\audible\le-pere-noel-revient\audition
```

## 1. Finalize the audio

```powershell
npm run audible:finalize -- <source.md> <spoken.md> <artifact-directory> --reviewer "Name"
```

This creates the reviewed transcript, rendered segments, assembled audio products, and their provenance manifest. Inputs are read fully into memory before the workspace is written, then restaged, so path aliasing cannot destroy an approved spoken script.

Equivalent stepwise commands: `audible:adapt` → edit draft → `audible:review` → `audible:render` → `audible:assemble`.

## 2. Prepare the YouTube package

Provide a 16:9 artwork image and publication metadata, then run:

```powershell
npm run audible:prepare:youtube -- `
  <artifact-directory> `
  <artwork.png> `
  <youtube.metadata.json> `
  [basename]
```

This creates:

- `<basename>.youtube.mp4` (1920×1080 when FFmpeg is available)
- `youtube-package.json`
- `youtube-title.txt`
- `youtube-description.md`
- `captions.fr.srt` / `captions.fr.vtt` when segment durations are available after assembly

No upload is performed. Package defaults remain private unless metadata overrides visibility. Packaging still requires a reviewed spoken transcript unless a visible development override is set.

When segment timings are missing, captions are omitted rather than faked; the reviewed transcript remains available for YouTube Studio. Sentence-level timing is deferred to issue #2 / the Media MVP.

## 3. Publish manually (human only)

Upload the generated video through YouTube Studio, apply the reviewed title and description, attach captions or transcript as needed, keep the first upload **private**, preview, then choose any later visibility change yourself.

No Ubikia command sets a video to public automatically.

## 4. Record the publication result

After the human publisher confirms the video state:

```powershell
npm run audible:record:youtube -- `
  <artifact-directory> `
  <youtube-url> `
  [visibility] `
  [recorded-by] `
  [published-at]
```

This updates:

- `manifest.json`
- `youtube-package.json`
- `publication.youtube.json`

The record includes the YouTube video identifier, URL, visibility, publication time, actor, video descriptor, transcript status, and provenance hashes. Its evidence type is `human_confirmation`; remote verification remains `not_performed` unless a separate verifier is used.

## State progression

```text
source
→ adapted
→ reviewed
→ (optional pronunciation audition)
→ rendered
→ assembled
→ packaged
→ manually uploaded (private first)
→ human-confirmed publication recorded
```

## Human gates

1. Spoken script approval (`review.json` / finalize reviewer).
2. Assembled audio listening check.
3. Private YouTube preview before any public visibility.
