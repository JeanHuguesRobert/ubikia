# Runbook — reference episode `le-pere-noel-revient`

Governed dry-run and real local run for issue #17.  
No command in this runbook publishes automatically to YouTube.

## Prerequisites

- Node.js 20+
- From repository root: `ubikia/`
- Optional for TTS/video: Gradium credentials in `.env`, FFmpeg and ffprobe on `PATH` or via `FFMPEG_PATH` / `FFPROBE_PATH`
- Optional for artwork: a 16:9 image (placeholder allowed for packaging tests)

Do not commit `.env`, WAV, MP3, Opus, MP4, or API responses.

## Project files (version-controlled)

| File | Role |
|------|------|
| `episode.json` | Machine-readable reference manifest and provenance |
| `source.md` | Immutable source snapshot at pinned commit |
| `spoken.draft.md` | Reviewable French spoken adaptation |
| `review.template.json` | Explicit human approval template |
| `youtube.metadata.json` | French YouTube metadata (private by default) |
| `pronunciation-audition.txt` | Cheap pronunciation sample |
| `RUNBOOK.md` | This file |

Generated media belongs under `artifacts/audible/le-pere-noel-revient/` (gitignored).

## Human gates (mandatory)

1. **Spoken script** — approve via `audible:review` before final render/package.
2. **Assembled audio** — listen before preparing the YouTube video package.
3. **Private YouTube preview** — upload private in YouTube Studio; only a human may later change visibility.

## Dry run (no TTS credentials)

### PowerShell

```powershell
# Validate the reference project structure, provenance, and metadata defaults
npm run audible:validate:reference -- examples\audible\le-pere-noel-revient

# Full unit/regression suite (offline)
npm test

# Prepare pronunciation audition text without calling Gradium
npm run audible:audition:prepare -- `
  examples\audible\le-pere-noel-revient\pronunciation-audition.txt `
  artifacts\audible\le-pere-noel-revient\audition
```

### POSIX

```sh
npm run audible:validate:reference -- examples/audible/le-pere-noel-revient
npm test
npm run audible:audition:prepare -- \
  examples/audible/le-pere-noel-revient/pronunciation-audition.txt \
  artifacts/audible/le-pere-noel-revient/audition
```

Expected: validation status `valid`; tests green; audition prepared without network credentials.

## Real local run (Gradium + FFmpeg)

### 1. Pronunciation audition (cheap)

PowerShell:

```powershell
npm run audible:audition -- `
  examples\audible\le-pere-noel-revient\pronunciation-audition.txt `
  artifacts\audible\le-pere-noel-revient\audition
```

POSIX:

```sh
npm run audible:audition -- \
  examples/audible/le-pere-noel-revient/pronunciation-audition.txt \
  artifacts/audible/le-pere-noel-revient/audition
```

### 2. Human-approve the spoken script

PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path artifacts\audible\le-pere-noel-revient | Out-Null
Copy-Item examples\audible\le-pere-noel-revient\source.md `
  artifacts\audible\le-pere-noel-revient\source.md
Copy-Item examples\audible\le-pere-noel-revient\spoken.draft.md `
  artifacts\audible\le-pere-noel-revient\spoken.draft.md
Copy-Item examples\audible\le-pere-noel-revient\review.template.json `
  artifacts\audible\le-pere-noel-revient\review-input.json

# Create adaptation workspace metadata if needed, then record review:
npm run audible:adapt -- `
  examples\audible\le-pere-noel-revient\source.md `
  artifacts\audible\le-pere-noel-revient
Copy-Item -Force examples\audible\le-pere-noel-revient\spoken.draft.md `
  artifacts\audible\le-pere-noel-revient\spoken.draft.md
npm run audible:review -- `
  artifacts\audible\le-pere-noel-revient `
  artifacts\audible\le-pere-noel-revient\review-input.json
```

POSIX:

```sh
mkdir -p artifacts/audible/le-pere-noel-revient
npm run audible:adapt -- \
  examples/audible/le-pere-noel-revient/source.md \
  artifacts/audible/le-pere-noel-revient
cp examples/audible/le-pere-noel-revient/spoken.draft.md \
  artifacts/audible/le-pere-noel-revient/spoken.draft.md
cp examples/audible/le-pere-noel-revient/review.template.json \
  artifacts/audible/le-pere-noel-revient/review-input.json
npm run audible:review -- \
  artifacts/audible/le-pere-noel-revient \
  artifacts/audible/le-pere-noel-revient/review-input.json
```

Or one-shot finalize (stages inputs safely even if they sit inside the output directory):

```powershell
npm run audible:finalize -- `
  examples\audible\le-pere-noel-revient\source.md `
  examples\audible\le-pere-noel-revient\spoken.draft.md `
  artifacts\audible\le-pere-noel-revient `
  --reviewer "Jean Hugues Noël Robert" `
  --title "Le Père Noël revient — et cette fois, il aide les adultes" `
  --series "Les carnets du baron Mariani — édition audio" `
  --language fr `
  --audience "adultes ayant conservé une âme d'enfant"
```

`finalize` requires valid Gradium credentials and FFmpeg. It does **not** publish to YouTube.

### 3. Stepwise render / assemble / video / package

If not using finalize:

```powershell
npm run audible:render -- `
  artifacts\audible\le-pere-noel-revient\source.md `
  artifacts\audible\le-pere-noel-revient `
  artifacts\audible\le-pere-noel-revient\spoken.reviewed.md

npm run audible:assemble -- artifacts\audible\le-pere-noel-revient

# Human listens to the assembled audio, then:
npm run audible:prepare:youtube -- `
  artifacts\audible\le-pere-noel-revient `
  path\to\artwork-16x9.png `
  examples\audible\le-pere-noel-revient\youtube.metadata.json `
  le-pere-noel-revient
```

Expected products under `artifacts/audible/le-pere-noel-revient/`:

- normalized `le-pere-noel-revient.wav` / `.mp3` / `.opus`
- `le-pere-noel-revient.youtube.mp4` (1080p when FFmpeg is available)
- `youtube-package.json`, `youtube-title.txt`, `youtube-description.md`
- `captions.fr.srt` / `captions.fr.vtt` when segment durations are available; otherwise the reviewed transcript is packaged for Studio

### 4. Manual private upload (human only)

1. Open YouTube Studio.
2. Upload `*.youtube.mp4` as **private**.
3. Apply title/description from the package.
4. Attach captions or paste the reviewed transcript if needed.
5. Preview privately. Do **not** make public until a human decides.

### 5. Record human-confirmed publication

```powershell
npm run audible:record:youtube -- `
  artifacts\audible\le-pere-noel-revient `
  https://youtu.be/<VIDEO_ID> `
  private `
  "Jean Hugues Noël Robert"
```

## Traceability checklist

After a real run, the artifact directory / manifests should answer:

| Question | Where |
|----------|--------|
| Source version? | `episode.json` + `source.md` + `manifest.source_sha256` |
| Persona / purpose? | `episode.json` |
| Who approved the spoken script? | `review.json` |
| Voice configuration? | `manifest.voice_id`, provider fields |
| Generated artifacts and hashes? | `manifest.json`, product descriptors |
| What remained manual? | upload + visibility + final publication decision |
| YouTube record? | `publication.youtube.json` after `audible:record:youtube` |

## Known limitations

- Segment-level captions are approximate; sentence-level timing is deferred to issue #2 / Media MVP.
- Source path discrepancy (hyphens vs underscores) is reported, not silently fixed.
- Synthetic-voice disclosure is configurable and must stay truthful for the actual Gradium voice in use.
