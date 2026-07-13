# Audible derived products

## Scope

This first implementation produces an audible derived product from Markdown while preserving a minimal provenance manifest.

It belongs to Ubikia because it transforms a corpus-backed written product into a situated form of appearance. Database services, scheduling, deployment, durable job state, and shared secret management remain outside this repository and belong to the `inseme` platform layer.

## Current pipeline

```text
Markdown or inline text
  -> oral preparation
  -> bounded text segments
  -> Gradium TTS
  -> one audio file per segment
  -> manifest.json + prepared.txt
```

The segments are deliberately not assembled yet. Audio assembly, normalization, publication, storage, and platform deployment are separate continuations.

## Environment

Copy `.env.example` to `.env` and set:

```dotenv
GRADIUM_API_KEY=...
GRADIUM_VOICE_ID=...
```

The real `.env` is ignored by Git.

## Test the custom voice

From the root of the `ubikia` checkout:

```bash
npm run audible:test
```

Equivalent direct invocation:

```bash
node --env-file=.env cli/audible-render.js \
  --text "On n’est jamais si bien servi que par soi-même ; demain, cela fera beaucoup de monde. À condition que tous sachent qui est le mandant." \
  --output artifacts/audible/test
```

## Render a Markdown article

From the root of `ubikia`, a source file may be outside this repository:

```bash
npm run audible:render -- \
  --input ../barons-Mariani/research/se_demultiplier_pour_explorer_le_possible_blogpost.md \
  --output artifacts/audible/on-nest-jamais-si-bien-servi
```

Equivalent direct invocation:

```bash
node --env-file=.env cli/audible-render.js \
  --input ../barons-Mariani/research/se_demultiplier_pour_explorer_le_possible_blogpost.md \
  --output artifacts/audible/on-nest-jamais-si-bien-servi
```

Optional arguments:

```text
--format wav|opus|pcm
--max-characters 2200
```

## Generated manifest

Each run records:

- source reference;
- source and prepared-text SHA-256 hashes;
- provider class;
- voice identifier;
- output format;
- segment sequence, size, and SHA-256 hash;
- explicit non-assembly status;
- provenance preservation flag.

## Known limits

The oral preparation is intentionally conservative and incomplete. It currently removes front matter, code blocks, Markdown decoration, raw URLs, and list markers. It does not yet provide:

- a governed pronunciation dictionary;
- semantic handling of footnotes, tables, citations, acronyms, and code excerpts;
- chapter introductions or editorial transitions;
- audio concatenation and loudness normalization;
- publication records or feedback return to the source corpus;
- database, queues, storage services, scheduling, or deployment.

These limits must remain visible rather than being hidden behind automatic publication.
