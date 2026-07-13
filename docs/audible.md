# Audible derived products

## Scope

This implementation produces an audible derived product from Markdown while preserving a provenance manifest.

It belongs to Ubikia because it transforms a corpus-backed written product into a situated form of appearance. Database services, scheduling, deployment, durable job state, public media hosting, and shared secret management remain outside this repository and belong to the `inseme` platform layer.

## Current pipeline

```text
Markdown or inline text
  -> oral preparation
  -> bounded text segments
  -> Gradium TTS
  -> resumable segment files
  -> FFmpeg lossless WAV assembly
  -> normalized MP3 and Opus products
  -> manifest.json + prepared.txt
```

Publication remains a separate, human-authorized stage. See [`audible-publication.md`](audible-publication.md).

## Environment

Copy `.env.example` to `.env` and set:

```dotenv
GRADIUM_API_KEY=...
GRADIUM_VOICE_ID=...
```

The real `.env` is ignored by Git.

Optional executable overrides:

```dotenv
FFMPEG_PATH=C:\path\to\ffmpeg.exe
FFPROBE_PATH=C:\path\to\ffprobe.exe
```

These overrides are useful when FFmpeg is unpacked but not added to `PATH`.

## Test the custom voice

From the root of the `ubikia` checkout:

```powershell
npm run audible:test
```

## Render a Markdown article

PowerShell-safe positional invocation:

```powershell
npm run audible:render -- `
  ..\barons-Mariani\research\se_demultiplier_pour_explorer_le_possible_blogpost.md `
  artifacts\audible\on-nest-jamais-si-bien-servi
```

Equivalent direct invocation:

```powershell
node --env-file=.env cli/audible-render.js `
  --input ..\barons-Mariani\research\se_demultiplier_pour_explorer_le_possible_blogpost.md `
  --output artifacts\audible\on-nest-jamais-si-bien-servi
```

Optional argument:

```text
--max-characters 900
```

The renderer retries transient Gradium failures and reuses existing non-empty segment files.

## Assemble and normalize

After FFmpeg and FFprobe are available:

```powershell
npm run audible:assemble -- artifacts\audible\on-nest-jamais-si-bien-servi
```

This produces, by default:

```text
on-nest-jamais-si-bien-servi.wav
on-nest-jamais-si-bien-servi.mp3
on-nest-jamais-si-bien-servi.opus
segments.ffconcat
```

The WAV is assembled without re-encoding. MP3 and Opus are normalized for spoken audio with these targets:

```text
integrated loudness: -16 LUFS
true peak: -1.5 dB
loudness range: 11 LU
MP3 bitrate: 128 kbit/s
Opus bitrate: 64 kbit/s
```

Optional assembly arguments:

```text
--basename article-name
--formats mp3,opus
--ffmpeg C:\path\to\ffmpeg.exe
--ffprobe C:\path\to\ffprobe.exe
--overwrite false
```

## Programmatic pipeline

`src/audible/pipeline.js` exposes `runAudiblePipeline()` for a later orchestration layer. It runs rendering and, unless disabled, assembly.

The current CLIs deliberately keep rendering and assembly separate so that synthesis can finish before FFmpeg is installed, and so that already-rendered segments remain reusable.

## Generated manifest

Rendering records:

- source reference;
- source and prepared-text SHA-256 hashes;
- provider class;
- voice identifier;
- segment sequence, size, SHA-256, and reuse status;
- rendering progress;
- provenance preservation status.

Assembly adds:

- assembly status;
- FFmpeg path;
- segment count;
- normalization targets;
- WAV, MP3, and Opus filenames;
- byte sizes;
- durations when FFprobe is available;
- SHA-256 for every assembled product.

## Known limits

The oral preparation is intentionally conservative and incomplete. It currently removes front matter, code blocks, Markdown decoration, raw URLs, and list markers. It does not yet provide:

- a governed pronunciation dictionary;
- semantic handling of footnotes, tables, citations, acronyms, and code excerpts;
- chapter introductions or editorial transitions;
- artwork or embedded ID3 metadata;
- publication records or feedback return to the source corpus;
- database, queues, public storage, scheduling, or deployment.

These limits must remain visible rather than being hidden behind automatic publication.
