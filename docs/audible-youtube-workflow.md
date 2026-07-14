# Governed audible publication to YouTube

This workflow turns a versioned written source into a reviewed audio edition, a YouTube-ready video, and a recorded publication result.

## Invariants

- The written source remains authoritative.
- A reviewed spoken transcript is required before rendering and packaging.
- Public publication is never performed automatically by this workflow.
- The human publisher chooses the final YouTube settings and performs the upload.
- The resulting public URL is recorded afterwards as human-confirmed evidence.
- Remote publication verification is distinct from human confirmation and is not implied.

## 1. Finalize the audio

```powershell
npm run audible:finalize -- <source.md> <spoken.md> <artifact-directory> <options>
```

This creates the reviewed transcript, rendered segments, assembled audio products, and their provenance manifest.

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

- `<basename>.youtube.mp4`
- `youtube-package.json`
- `youtube-title.txt`
- `youtube-description.md`

No upload is performed.

## 3. Publish manually

Upload the generated video through YouTube Studio, apply the reviewed title and description, select the intended podcast or playlist, and choose the final visibility.

## 4. Record the publication result

After the human publisher confirms that the video is live, record the result:

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
→ rendered
→ assembled
→ packaged
→ manually uploaded
→ human-confirmed publication recorded
```
