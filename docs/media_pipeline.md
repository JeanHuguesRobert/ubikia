---
document_role: "source"
document_kind: "technical-architecture"
visibility: "public"
lifecycle_state: "working"
version: "0.1"
date: "2026-07-12"
repository: "JeanHuguesRobert/ubikia"
related_documents:
  - "README.md"
  - "docs/concepts.md"
  - "docs/derivation_workflow.md"
  - "docs/publication_layer.md"
  - "docs/media_mvp_implementation_plan.md"
  - "docs/media_agent_runbook.md"
---

# Ubikia Media
## Architecture for traceable audio and audiovisual derivation

## 1. Purpose

Ubikia Media is the multimedia production subsystem of Ubikia.

It transforms an approved editorial product into traceable media artifacts without silently rewriting the source discourse.

The initial target chain is:

```text
versioned source corpus
  ↓
approved blog essay or public essay
  ↓
spoken-essay script
  ↓
utterance plan
  ↓
narrated audio master
  ↓
caption tracks
  ↓
audiovisual master
  ↓
platform-specific renders and metadata packages
  ↓
manual publication
  ↓
publication ledger
  ↓
return to corpus
```

The first practical use case is the derivation of:

```text
barons-Mariani/research/pluralisation_cognitive_sous_mandat.md
  ↓
barons-Mariani/research/se_demultiplier_pour_explorer_le_possible_blogpost.md
  ↓
spoken essay
  ↓
podcast episode
  ↓
landscape video
  ↓
vertical excerpts
```

Ubikia Media is not a new author. It is a governed rendering and packaging system.

Its central rule is:

> Render without silently rewriting.

Its relation to the wider project is:

```text
Cogentia
  = structures thought and preserves cognitive coherence

Ubikia
  = structures situated editorial appearance

Ubikia Media
  = renders approved appearances into audio and audiovisual artifacts
```

## 2. Non-goals of the first MVP

The first MVP must not attempt to solve all multimedia production problems.

It is explicitly not:

- an autonomous publisher;
- a social-media engagement optimizer;
- a real-time video editor;
- a full non-linear editing application;
- an avatar or lip-synchronization system;
- a voice-cloning laboratory;
- a generative-video platform;
- a stock-media marketplace;
- a rights-management platform;
- a podcast hosting service;
- a replacement for human editorial review;
- a system that uploads automatically to external platforms.

The MVP should produce useful files locally and prepare publication packages. Publication remains manual until provenance, review, platform credentials, retry semantics, and ledger updates are stable.

## 3. Core distinctions

### 3.1 Source document

A source document carries doctrine or substance.

Example:

```text
research/pluralisation_cognitive_sous_mandat.md
```

### 3.2 Intermediate editorial product

An intermediate editorial product is already a derived appearance, such as a blog essay.

Example:

```text
research/se_demultiplier_pour_explorer_le_possible_blogpost.md
```

It may be used as a practical base for oral adaptation, but its relation to the sovereign source must remain explicit.

### 3.3 Spoken-essay script

A spoken-essay script is not merely the blog essay with Markdown removed.

It is an approved oral adaptation that may:

- shorten sentences;
- replace tables with spoken explanations;
- announce transitions;
- expand acronyms;
- remove raw URLs from narration;
- convert lists into audible sequences;
- add pauses and pronunciation hints;
- preserve the core claim and source relation.

The spoken script is a derived editorial product and therefore requires review.

### 3.4 Utterance

An utterance is the smallest independently synthesized unit of speech.

For the MVP, an utterance should normally contain one sentence or one short spoken block.

Each utterance has:

- a stable ID;
- normalized text;
- optional speech-markup text;
- language;
- voice profile;
- rate and pause settings;
- source location;
- output audio file;
- measured duration;
- checksum;
- synthesis provider metadata.

Rendering sentence-sized utterances provides three advantages:

1. changed sentences can be regenerated without rebuilding all narration;
2. subtitle timings are known from actual audio durations;
3. failed synthesis can resume at the first missing unit.

### 3.5 Narrated audio master

The narrated audio master is the approved, assembled, normalized audio artifact.

It should be archived as lossless WAV and exported as podcast-friendly MP3 or M4A.

### 3.6 Visual scene

A visual scene is a timed visual unit associated with one or more utterances.

The first MVP supports deterministic scenes only:

- cover scene;
- chapter title scene;
- quotation card;
- body text card;
- source/provenance card;
- optional supplied image with attribution;
- closing card.

Generative imagery is an extension point, not an MVP dependency.

### 3.7 Audiovisual master

The audiovisual master combines:

- the narrated master;
- visual scenes;
- captions;
- chapter information;
- provenance cards;
- optional background ambience under explicit configuration.

The first master is landscape 16:9.

### 3.8 Platform render

A platform render is a media encoding derived from the master for a defined publication scene.

Examples:

```text
YouTube landscape video
Facebook landscape video
LinkedIn landscape video
Instagram vertical excerpt
YouTube Shorts vertical excerpt
podcast MP3
caption-only VTT package
```

A platform render is not a new source and must not modify the approved narration.

### 3.9 Publication package

A publication package contains the artifact plus the metadata needed for manual publication:

- title;
- subtitle or description;
- excerpt;
- tags;
- source URL;
- public article URL when available;
- thumbnail;
- alt text;
- captions;
- chapters;
- platform notes;
- review status;
- artifact checksums.

### 3.10 Publication record

A publication record states where a specific platform render appeared.

It is created only after actual publication and contains the public URL and publication date.

## 4. Governing invariants

### Invariant 1 — Source provenance

Every project must identify:

- source repository;
- source path;
- source commit or immutable reference;
- intermediate product, if used;
- script version;
- human reviewer;
- render configuration.

### Invariant 2 — Editorial and rendering separation

The render pipeline must not silently rewrite narration.

Text transformation occurs in an explicit script-preparation step. After script approval, rendering only normalizes text according to declared mechanical rules, such as whitespace cleanup or SSML escaping.

### Invariant 3 — Human approval boundary

The default state machine is:

```text
draft_script
→ script_review_required
→ script_approved
→ audio_rendered
→ audio_review_required
→ audio_approved
→ video_rendered
→ video_review_required
→ publication_package_ready
→ manually_published
```

No state transition to `approved` may be inferred from file existence alone.

### Invariant 4 — Deterministic manifests

Every render must be reconstructible from:

- project manifest;
- script manifest;
- provider configuration excluding secrets;
- source asset checksums;
- tool versions;
- render profile;
- generated artifact manifest.

Byte-identical results are desirable but not required when external TTS providers are nondeterministic. Reconstructible inputs and provider metadata are required.

### Invariant 5 — No hidden publication

The MVP may prepare and export. It must not upload, publish, schedule, delete, or modify external publications.

### Invariant 6 — Rights and attribution

Every non-generated external visual or audio asset must declare:

- origin;
- creator when known;
- licence;
- attribution text;
- permission status;
- local checksum.

An asset with unknown rights must fail validation unless the project explicitly marks it as private-test-only.

### Invariant 7 — Voice disclosure

The artifact manifest must identify whether narration is:

- human-recorded;
- synthetic generic voice;
- synthetic authorized cloned voice;
- mixed.

Voice cloning is outside MVP scope. Future support must require explicit authorization and provenance.

### Invariant 8 — Accessibility

Every video render must have:

- SRT captions;
- WebVTT captions;
- readable text contrast;
- safe margins;
- a text transcript;
- alt text for the thumbnail.

### Invariant 9 — Cache transparency

Cached utterances must be keyed by all inputs that can change their sound:

```text
provider
provider version when known
voice
language
rate
pitch
text or SSML
normalization version
```

A stale cache must not be silently reused.

### Invariant 10 — Failure resumability

Each stage writes its outputs atomically and updates a stage manifest only after validation.

A failed project must resume from the first incomplete or invalid stage, not restart from zero.

## 5. Logical architecture

```text
CLI
  ↓
Project Loader
  ↓
Schema Validator
  ↓
Source Resolver
  ↓
Script Parser
  ↓
Utterance Planner
  ↓
TTS Provider Adapter
  ↓
Audio Assembler and Normalizer
  ↓
Caption Builder
  ↓
Scene Planner
  ↓
Card Renderer
  ↓
FFmpeg Video Renderer
  ↓
Quality-Control Checks
  ↓
Platform Packager
  ↓
Artifact Manifest and Ledger Stub
```

### 5.1 CLI layer

The CLI is the only required user interface for the MVP.

It must expose small composable commands rather than one opaque command.

Target commands:

```bash
ubikia-media doctor
ubikia-media validate PROJECT
ubikia-media plan PROJECT
ubikia-media synthesize PROJECT
ubikia-media assemble-audio PROJECT
ubikia-media captions PROJECT
ubikia-media render-scenes PROJECT
ubikia-media render-video PROJECT
ubikia-media package PROJECT --profile youtube
ubikia-media build PROJECT
ubikia-media inspect PROJECT
ubikia-media clean PROJECT --stage captions
```

### 5.2 Project loader

The loader reads one project YAML file, resolves paths relative to that file, applies environment-variable substitutions only in explicitly allowed fields, and produces a typed immutable configuration object.

Secrets must not be stored in the project manifest.

### 5.3 Source resolver

The source resolver records provenance. It does not need to clone remote repositories in the MVP.

It accepts:

- a local checked-out source path;
- a remote GitHub URL plus commit for metadata only;
- an intermediate local script path.

If the source file is not locally available, rendering may proceed from an approved local spoken script, but provenance validation must still require a remote source reference.

### 5.4 Script parser

The parser reads a controlled Markdown subset.

Supported constructs:

- YAML frontmatter;
- level-one to level-three headings;
- paragraphs;
- block quotes;
- simple lists;
- explicit directives in HTML comments.

MVP directives:

```markdown
<!-- media:pause=800ms -->
<!-- media:chapter="Le soi se peuple" -->
<!-- media:quote-card -->
<!-- media:pronounce term="JHN" as="ji ache enne" -->
<!-- media:exclude-from-speech -->
```

The parser must reject unsupported directives instead of ignoring them silently.

### 5.5 Utterance planner

The planner converts approved script blocks into utterances.

Rules:

1. headings become chapter announcements unless excluded;
2. paragraphs split by sentence boundaries;
3. quotations remain identifiable;
4. utterances should target 30 to 350 characters;
5. fragments shorter than 30 characters may merge with the next sentence;
6. utterances longer than 350 characters split at punctuation;
7. each utterance receives a stable ID derived from chapter, order, and normalized text hash;
8. explicit pauses become timeline events;
9. URLs are omitted from speech unless explicitly marked to be spoken;
10. code blocks are excluded unless an explicit spoken alternative is supplied.

The planner writes `work/utterances.json` before synthesis.

### 5.6 TTS provider adapter

The core must not depend directly on one vendor.

Provider interface:

```python
class TTSProvider(Protocol):
    def provider_id(self) -> str: ...
    def capabilities(self) -> TTSCapabilities: ...
    def synthesize(self, request: SynthesisRequest, output_wav: Path) -> SynthesisResult: ...
```

Required MVP adapters:

1. `mock` — deterministic local test provider that creates tone or silence WAV files;
2. `command` — invokes a configured executable with placeholders and expects a WAV output.

The command adapter makes the MVP usable with local or hosted TTS tools without coupling the core to one service.

Example configuration:

```yaml
tts:
  provider: command
  command:
    argv:
      - piper
      - --model
      - "${UBIKIA_MEDIA_PIPER_MODEL}"
      - --output_file
      - "{output_wav}"
    stdin: "{text}"
  voice: fr_FR-default
  language: fr-FR
```

Provider-specific adapters may later be added behind the same interface.

### 5.7 Audio assembler

Each utterance is synthesized independently as mono PCM WAV.

The assembler:

1. validates sample rate and channels;
2. inserts configured pauses;
3. concatenates utterances in timeline order;
4. records exact start and end timestamps;
5. performs loudness normalization;
6. emits lossless master WAV;
7. emits MP3 export;
8. writes an audio manifest.

Default target:

```yaml
audio:
  sample_rate_hz: 48000
  channels: 1
  master_format: wav
  loudness_lufs: -16
  true_peak_db: -1.5
  loudness_range_lu: 11
  podcast_mp3_kbps: 128
```

The implementation should use `ffmpeg` and `ffprobe`, not custom DSP, for the MVP.

### 5.8 Caption builder

Because utterances are synthesized independently, their measured durations define caption intervals.

Caption rules:

- one caption cue per utterance by default;
- maximum two visible lines;
- target 42 characters per line;
- no cue shorter than 800 ms unless necessary;
- long utterances may split into multiple cues proportionally by token weight;
- preserve punctuation;
- produce UTF-8 SRT and WebVTT;
- verify non-overlap and monotonic timestamps.

Caption timing is derived from actual audio, not estimated before synthesis.

### 5.9 Scene planner

The scene planner maps timeline intervals to visual scenes.

Default mapping:

- project start → cover scene;
- heading utterance → chapter card;
- marked quotation → quote card;
- normal narration → body card carrying a short excerpt or chapter title;
- final interval → source and links card.

The scene plan is serialized before rendering.

The planner must not place an entire spoken paragraph on screen. It selects short display text from explicit metadata or deterministic truncation rules.

### 5.10 Card renderer

The card renderer creates PNG images with Pillow.

It must support:

- landscape 1920×1080;
- vertical 1080×1920 as an extension profile;
- configurable background and foreground colours;
- title, subtitle, chapter, quote, source, and footer regions;
- font fallback;
- line wrapping;
- safe margins;
- logo or portrait only when a supplied licensed asset exists;
- deterministic layout.

The repository must never include redistributed font files unless their licence and inclusion are explicitly approved. Configuration should reference locally installed fonts or documented open font packages.

### 5.11 Video renderer

The renderer uses FFmpeg.

MVP video strategy:

1. create one video segment per static PNG scene using `-loop 1`;
2. set each segment duration from the scene plan;
3. concatenate segments;
4. attach normalized narration;
5. optionally burn captions;
6. preserve external SRT and VTT files;
7. encode H.264 with broadly compatible pixel format;
8. validate duration and streams with ffprobe.

Default landscape profile:

```yaml
video:
  width: 1920
  height: 1080
  fps: 25
  video_codec: libx264
  pixel_format: yuv420p
  crf: 20
  preset: medium
  audio_codec: aac
  audio_bitrate: 192k
  captions: burned_and_sidecar
```

The first MVP does not require transitions. Hard cuts between clean cards are acceptable and easier to validate.

### 5.12 Quality-control layer

QC runs after every major stage.

Required checks:

- all declared source files or URLs exist syntactically;
- project schema valid;
- script approval status explicit;
- no empty utterance;
- no missing utterance WAV;
- all WAV files decodable;
- audio duration positive;
- caption timeline monotonic;
- final video has one video stream and one audio stream;
- audio/video duration difference under 250 ms;
- output resolution and codec match profile;
- output files have SHA-256 checksums;
- no unresolved `${ENV_VAR}` placeholders in public manifests;
- no secret values written to manifests or logs.

QC failure prevents package status from becoming `ready_for_review`.

### 5.13 Platform packager

The packager creates folders, not uploads.

Initial profiles:

```text
podcast
youtube
facebook_video
linkedin_video
instagram_reel_future
youtube_short_future
```

MVP packages:

- `podcast` — MP3, transcript, cover image, title, description, source links;
- `youtube` — landscape MP4, thumbnail, SRT, VTT, chapters, description;
- `facebook_video` — landscape MP4, post text placeholder, captions, source link;
- `linkedin_video` — landscape MP4, professional description placeholder, captions, source link.

Vertical excerpts are planned after the landscape pipeline is stable.

## 6. Recommended directory structure

```text
ubikia/
  docs/
    media_pipeline.md
    media_mvp_implementation_plan.md
    media_agent_runbook.md
  schemas/
    media_project.schema.yaml
    media_artifact.schema.yaml
  examples/
    pluralisation_cognitive_media/
      project.yaml
      spoken_script.md
      assets/
        README.md
  src/
    ubikia_media/
      __init__.py
      cli.py
      config.py
      models.py
      errors.py
      logging.py
      paths.py
      provenance.py
      script_parser.py
      utterances.py
      timeline.py
      cache.py
      subprocesses.py
      providers/
        __init__.py
        base.py
        mock_tts.py
        command_tts.py
      audio/
        __init__.py
        probe.py
        assemble.py
        normalize.py
        export.py
      captions/
        __init__.py
        split.py
        srt.py
        vtt.py
        validate.py
      visuals/
        __init__.py
        scene_plan.py
        layout.py
        cards.py
      video/
        __init__.py
        render.py
        probe.py
      packaging/
        __init__.py
        profiles.py
        package.py
      qc/
        __init__.py
        checks.py
        report.py
  tests/
    unit/
    integration/
    fixtures/
  pyproject.toml
```

Generated project outputs remain outside `src/`:

```text
<project>/
  project.yaml
  spoken_script.md
  work/
    source_snapshot.json
    utterances.json
    utterance_audio/
    timeline.json
    scenes.json
    cards/
    concat/
    logs/
  output/
    audio/
      master.wav
      podcast.mp3
    captions/
      captions.srt
      captions.vtt
    video/
      landscape_1080p.mp4
    transcript/
      transcript.txt
    manifests/
      artifacts.json
      qc.json
    packages/
      podcast/
      youtube/
      facebook_video/
      linkedin_video/
```

## 7. State and artifact manifests

Every generated artifact has a sidecar record:

```yaml
artifact:
  id: pluralisation-audio-master-v1
  kind: narrated_audio_master
  path: output/audio/master.wav
  sha256: pending
  media_type: audio/wav
  generated_at: pending
  generator:
    name: ubikia-media
    version: pending
  inputs:
    project_sha256: pending
    script_sha256: pending
    utterance_manifest_sha256: pending
  review:
    required: true
    status: pending
```

Project state is explicit:

```text
initialized
validated
planned
speech_partial
speech_complete
audio_complete
captions_complete
scenes_complete
video_complete
qc_passed
package_ready
approved
published
superseded
```

State is descriptive, not authoritative. The implementation must verify artifacts rather than trusting a stale state string.

## 8. Extension points

### 8.1 Additional TTS providers

Provider adapters may support:

- local neural TTS;
- cloud TTS;
- human-recorded utterance import;
- authorized voice cloning.

All must return the same result model.

### 8.2 Generative imagery

A future image provider may propose visual assets. It must not directly place them into approved renders.

Proposed flow:

```text
scene requirement
→ image prompt derived under review
→ candidate image
→ rights/provenance record
→ human approval
→ approved asset
→ render
```

### 8.3 Music and ambience

Future background music requires:

- licensed asset;
- attribution metadata;
- automatic ducking;
- intelligibility checks;
- explicit project opt-in.

The MVP has no background music by default.

### 8.4 Vertical excerpts

A future excerpt planner may select coherent 30–90 second intervals.

Selection must be explicit and reviewable because excerpt choice changes emphasis and therefore exercises agenda power.

### 8.5 Upload adapters

Platform APIs are outside MVP scope.

Future upload adapters must preserve the distinction:

```text
prepare
export
create_draft
publish
update
delete
```

Only `prepare` and `export` are non-consequential by default.

## 9. Privacy and security

- project manifests must not contain API keys;
- subprocess commands must use argument arrays, never shell interpolation by default;
- logs must redact configured secret environment variables;
- remote assets must be downloaded only through explicit commands and stored with checksums;
- HTML, Markdown, SSML, and subtitle text must be escaped for their target formats;
- source text is untrusted input and must not become shell arguments without safe encoding;
- paths must be constrained to the project root unless explicitly allowed;
- generated manifests must not reproduce private source text unnecessarily;
- temporary audio must remain local unless a configured TTS provider requires transmission;
- provider metadata must state when text left the local machine.

## 10. Definition of the first successful MVP

The MVP is successful when a clean machine with Python and FFmpeg can execute:

```bash
ubikia-media build examples/pluralisation_cognitive_media/project.yaml \
  --tts-provider mock
```

and produce a fully validated test package with deterministic mock audio.

It is practically useful when the same project can execute with a configured real `command` TTS provider and produce:

- a lossless narration master;
- an MP3 podcast file;
- SRT and VTT captions;
- a 1080p landscape MP4 with automatic title, chapter, quote, and provenance cards;
- YouTube, podcast, Facebook, and LinkedIn package directories;
- checksums, QC report, and publication-ledger stub.

The output must be resumable, inspectable, and reproducible from declared inputs.

## 11. Closing formula

A spoken essay is not a voice pasted onto an article.

A video is not an audio file hidden behind arbitrary images.

Ubikia Media must preserve the complete derivation chain:

```text
source
→ approved discourse
→ spoken form
→ media artifacts
→ platform appearances
→ publication trace
→ return to corpus
```

> Automate rendering. Preserve authorship, provenance, and human control.
