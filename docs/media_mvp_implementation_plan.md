---
document_role: "source"
document_kind: "implementation-plan"
visibility: "public"
lifecycle_state: "working"
version: "0.1"
date: "2026-07-12"
repository: "JeanHuguesRobert/ubikia"
implementation_target: "Ubikia Media MVP"
related_documents:
  - "docs/media_pipeline.md"
  - "docs/media_agent_runbook.md"
  - "schemas/media_project.schema.yaml"
  - "schemas/media_artifact.schema.yaml"
---

# Ubikia Media MVP — Detailed Implementation Plan
## An incremental contract for coding agents

## 1. Audience and intent

This plan is written so that a coding agent with limited autonomy can implement Ubikia Media one bounded task at a time.

The agent is not expected to redesign the architecture.

For each task, the agent must:

1. read `AGENTS.md`;
2. read `docs/media_pipeline.md`;
3. implement only the named task;
4. add or update the required tests;
5. run the specified validation commands;
6. report the exact files changed;
7. stop when the acceptance criteria are met;
8. never continue automatically into the next task.

A task is not complete because code exists. It is complete only when its acceptance tests pass.

## 2. Fixed architectural decisions for MVP

The following choices are fixed unless a human explicitly changes the specification.

### 2.1 Language and runtime

- Python 3.12 or later within the Python 3.x series;
- package name: `ubikia-media`;
- import package: `ubikia_media`;
- command: `ubikia-media`;
- source layout: `src/ubikia_media`;
- tests: `pytest`;
- type checking: `mypy` or `pyright`, selected once in M0 and then kept stable;
- formatting: `ruff format`;
- linting: `ruff check`.

### 2.2 Core dependencies

Use narrowly scoped dependencies:

```text
typer          CLI
pydantic       typed models and validation
PyYAML         YAML loading
rich           readable CLI output
Pillow         deterministic card rendering
```

Use the standard library where adequate.

FFmpeg and ffprobe are external runtime dependencies and must be invoked through safe subprocess argument arrays.

Do not add a web framework, database, task queue, browser automation stack, or GUI framework to the MVP.

### 2.3 Media strategy

- one WAV file per utterance;
- one assembled lossless WAV master;
- one podcast MP3 export;
- captions derived from measured utterance durations;
- static card scenes rendered as PNG;
- FFmpeg landscape video from timed PNG scenes plus narration;
- no generative image dependency;
- no music by default;
- no external publication API.

### 2.4 TTS strategy

The core is provider-independent.

MVP providers:

- `mock`: deterministic local tones or silence, used by tests;
- `command`: configurable external executable, used for real speech.

Do not hard-code a vendor SDK into core modules.

### 2.5 Storage strategy

- YAML for human-authored project configuration;
- JSON for generated machine manifests;
- local filesystem for work and outputs;
- SHA-256 checksums for provenance and cache validation;
- no database.

### 2.6 Publication strategy

The MVP prepares package directories only.

It must not upload or publish.

## 3. Global repository target

After MVP completion, the relevant tree should resemble:

```text
pyproject.toml
src/ubikia_media/
  __init__.py
  __main__.py
  cli.py
  config.py
  models.py
  errors.py
  logging.py
  paths.py
  provenance.py
  hashing.py
  state.py
  cache.py
  subprocesses.py
  script_parser.py
  utterances.py
  timeline.py
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
    models.py
    split.py
    srt.py
    vtt.py
    validate.py
  visuals/
    __init__.py
    models.py
    scene_plan.py
    layout.py
    cards.py
  video/
    __init__.py
    profiles.py
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
schemas/
  media_project.schema.yaml
  media_artifact.schema.yaml
examples/pluralisation_cognitive_media/
  project.yaml
  spoken_script.md
  assets/README.md
tests/
  unit/
  integration/
  fixtures/
```

Generated files must not be committed except small deterministic fixtures explicitly used by tests.

## 4. Command contract

The final CLI contract is:

```bash
ubikia-media doctor
ubikia-media validate PROJECT
ubikia-media plan PROJECT
ubikia-media synthesize PROJECT [--force]
ubikia-media assemble-audio PROJECT [--force]
ubikia-media captions PROJECT [--force]
ubikia-media render-scenes PROJECT [--force]
ubikia-media render-video PROJECT [--profile landscape_1080p] [--force]
ubikia-media package PROJECT --profile PROFILE [--force]
ubikia-media build PROJECT [--tts-provider PROVIDER] [--force]
ubikia-media inspect PROJECT [--json]
ubikia-media clean PROJECT --stage STAGE
```

Exit codes:

```text
0 success
2 invalid user input or invalid project
3 missing dependency or environment requirement
4 external provider failure
5 media rendering failure
6 QC failure
7 unsafe or forbidden operation
10 unexpected internal error
```

Commands must display a concise error and must not print a Python stack trace unless `--debug` is supplied.

## 5. Milestone map

```text
M0  project scaffold and developer tooling
M1  typed models, YAML loading, paths, and schema validation
M2  provenance, hashing, state, and atomic writes
M3  spoken-script parser and utterance planner
M4  TTS provider abstraction, mock provider, and command provider
M5  audio probing, assembly, normalization, and MP3 export
M6  timeline and caption generation
M7  scene planning and deterministic card rendering
M8  landscape video rendering and probing
M9  quality control and artifact manifests
M10 platform package generation
M11 end-to-end example, documentation, and release readiness
M12 optional post-MVP vertical excerpt foundation
```

M0 through M11 define the first useful MVP. M12 is documented but not required for MVP completion.

---

# M0 — Project scaffold and developer tooling

## M0.1 Objective

Create an installable Python package with a working CLI and stable developer commands.

## M0.2 Files to create

```text
pyproject.toml
src/ubikia_media/__init__.py
src/ubikia_media/__main__.py
src/ubikia_media/cli.py
src/ubikia_media/errors.py
tests/unit/test_cli_smoke.py
.gitignore additions if needed
```

## M0.3 Required implementation

### `pyproject.toml`

Define:

- build backend;
- project metadata;
- Python requirement;
- runtime dependencies;
- optional `dev` dependencies;
- console script `ubikia-media = ubikia_media.cli:app`;
- Ruff configuration;
- pytest configuration;
- selected type checker configuration.

Do not claim production stability. Use version `0.0.1`.

### `__init__.py`

Expose:

```python
__version__ = "0.0.1"
```

### `errors.py`

Create a base exception hierarchy:

```python
class UbikiaMediaError(Exception): ...
class ConfigurationError(UbikiaMediaError): ...
class DependencyError(UbikiaMediaError): ...
class ProviderError(UbikiaMediaError): ...
class RenderError(UbikiaMediaError): ...
class QCError(UbikiaMediaError): ...
class UnsafeOperationError(UbikiaMediaError): ...
```

Each exception may carry a stable `exit_code`.

### `cli.py`

Create a Typer application with:

```bash
ubikia-media --version
ubikia-media doctor
```

At M0, `doctor` checks only:

- Python version;
- presence of `ffmpeg`;
- presence of `ffprobe`.

Output must be human-readable and return exit code 3 when a dependency is missing.

## M0.4 Tests

- CLI application imports;
- `--version` prints the package version;
- doctor result model can represent success and failure;
- subprocess lookup is monkeypatched in tests.

## M0.5 Validation commands

```bash
python -m pip install -e '.[dev]'
ruff format --check .
ruff check .
pytest -q
python -m ubikia_media --version
```

## M0.6 Acceptance criteria

- package installs in editable mode;
- console command exists;
- tests pass without FFmpeg by mocking dependency lookup;
- missing real FFmpeg produces exit code 3, not an internal traceback;
- no media pipeline code is added yet.

## M0.7 Prohibited shortcuts

- no shell script as the primary CLI;
- no untyped global dictionary for configuration;
- no vendor TTS dependency;
- no automatic download of FFmpeg.

---

# M1 — Models, project loading, paths, and schema validation

## M1.1 Objective

Load a project YAML into typed models, resolve safe paths, and validate the human-authored configuration.

## M1.2 Files to create

```text
src/ubikia_media/models.py
src/ubikia_media/config.py
src/ubikia_media/paths.py
schemas/media_project.schema.yaml
tests/unit/test_config.py
tests/unit/test_paths.py
tests/fixtures/minimal_project/project.yaml
```

## M1.3 Required models

Implement Pydantic models for:

```text
SourceReference
IntermediateProductReference
ScriptConfig
TTSCommandConfig
TTSConfig
AudioConfig
CaptionConfig
VisualThemeConfig
VideoProfileConfig
PackageTargetConfig
ReviewStatus
MediaProject
```

The exact YAML contract is defined by `schemas/media_project.schema.yaml`.

Minimum `MediaProject` fields:

```python
project_id: str
title: str
language: str
source: SourceReference
intermediate_product: IntermediateProductReference | None
script: ScriptConfig
tts: TTSConfig
audio: AudioConfig
captions: CaptionConfig
visuals: VisualThemeConfig
video_profiles: dict[str, VideoProfileConfig]
packages: list[PackageTargetConfig]
review: ReviewStatus
```

## M1.4 Path safety

Create a `ProjectPaths` object derived from the project YAML location.

Rules:

- relative paths resolve against the project file directory;
- generated `work/` and `output/` directories remain below project root;
- paths containing `..` are allowed only if their resolved target remains below project root, except declared read-only source paths;
- generated outputs may never escape project root;
- symlink traversal must be checked after resolution;
- the command adapter executable is not treated as a project path.

Provide functions:

```python
def load_project(path: Path) -> LoadedProject: ...
def resolve_project_paths(project_file: Path, model: MediaProject) -> ProjectPaths: ...
def assert_within(root: Path, candidate: Path) -> Path: ...
```

## M1.5 Environment substitution

Allow `${NAME}` substitution only in fields explicitly typed as environment-expandable:

- TTS command arguments;
- TTS command environment values;
- optional font path;
- optional tool path overrides.

Do not substitute environment variables throughout arbitrary YAML text.

Missing required variables produce `ConfigurationError` and name the missing variables without printing their values.

## M1.6 CLI work

Add:

```bash
ubikia-media validate PROJECT
```

It must:

1. load YAML;
2. validate Pydantic model;
3. validate path safety;
4. validate schema version;
5. print a summary;
6. perform no rendering.

## M1.7 Tests

Test:

- minimal valid project;
- unknown top-level field rejected;
- missing required field rejected;
- unsafe output path rejected;
- environment substitution in allowed field;
- missing environment variable error;
- environment string in ordinary title remains literal;
- invalid review status rejected.

## M1.8 Acceptance criteria

- example minimal project validates;
- error paths identify YAML field locations;
- generated paths cannot escape project root;
- schema and Pydantic models agree for fixture examples;
- no directories are created by `validate`.

---

# M2 — Provenance, hashing, state, cache keys, and atomic writes

## M2.1 Objective

Build the infrastructure that makes later media generation resumable and inspectable.

## M2.2 Files to create

```text
src/ubikia_media/hashing.py
src/ubikia_media/provenance.py
src/ubikia_media/state.py
src/ubikia_media/cache.py
src/ubikia_media/paths.py updates
src/ubikia_media/subprocesses.py
tests/unit/test_hashing.py
tests/unit/test_state.py
tests/unit/test_cache.py
tests/unit/test_subprocesses.py
```

## M2.3 Hashing

Provide:

```python
def sha256_file(path: Path) -> str: ...
def sha256_bytes(data: bytes) -> str: ...
def sha256_text(text: str) -> str: ...
def canonical_json_sha256(value: Any) -> str: ...
```

Canonical JSON uses:

- UTF-8;
- sorted keys;
- compact separators;
- normalized newline policy;
- no NaN values.

## M2.4 Atomic writes

Provide:

```python
def atomic_write_bytes(path: Path, data: bytes) -> None: ...
def atomic_write_text(path: Path, text: str) -> None: ...
def atomic_write_json(path: Path, value: Any) -> None: ...
```

Rules:

- write temporary file in the same directory;
- flush and fsync before replace where supported;
- replace atomically;
- remove temporary file on failure;
- never expose a partial manifest.

## M2.5 Provenance snapshot

Create `work/source_snapshot.json` with:

```json
{
  "source_repository": "...",
  "source_path": "...",
  "source_commit": "...",
  "source_url": "...",
  "intermediate_product": {},
  "script_path": "...",
  "script_sha256": "...",
  "project_sha256": "...",
  "created_at": "..."
}
```

The snapshot must not copy the full source text.

## M2.6 State model

Create generated `work/state.json`.

Each stage record includes:

```json
{
  "status": "complete",
  "input_hash": "...",
  "outputs": [{"path": "...", "sha256": "..."}],
  "started_at": "...",
  "completed_at": "...",
  "tool_version": "..."
}
```

A stage is reusable only when:

- status is complete;
- input hash matches;
- all output files exist;
- output checksums match.

## M2.7 Cache keys

TTS cache key must include:

```python
provider_id
provider_config_fingerprint
voice
language
rate
pitch
normalized_text_or_ssml
normalization_version
```

Secrets must be excluded from stored configuration fingerprints. A secret's presence may influence a provider identity marker, but its value must not be hashed into a public manifest unless the hash itself is considered sensitive and stored privately.

## M2.8 Safe subprocess wrapper

Provide:

```python
@dataclass(frozen=True)
class CommandResult:
    argv_redacted: list[str]
    returncode: int
    stdout: str
    stderr: str
    duration_seconds: float


def run_command(
    argv: Sequence[str],
    *,
    stdin_text: str | None = None,
    cwd: Path | None = None,
    env: Mapping[str, str] | None = None,
    timeout_seconds: float = 300,
    redacted_indexes: set[int] | None = None,
) -> CommandResult: ...
```

Rules:

- `shell=False` always;
- bounded timeout;
- UTF-8 decoding with replacement;
- redact configured arguments from logs;
- raise typed error on timeout or non-zero exit when requested;
- no command string concatenation.

## M2.9 Tests

Test atomic replacement, tampered output invalidation, input hash change invalidation, cache-key stability, secret redaction, subprocess timeout, and non-shell execution.

## M2.10 Acceptance criteria

- interrupted writes leave no final partial file;
- editing one script character changes relevant hashes;
- tampering with a cached WAV invalidates the stage;
- command logs do not expose secret values;
- no actual FFmpeg invocation required yet.

---

# M3 — Spoken-script parser and utterance planner

## M3.1 Objective

Convert an approved spoken Markdown script into a deterministic utterance plan.

## M3.2 Files to create

```text
src/ubikia_media/script_parser.py
src/ubikia_media/utterances.py
src/ubikia_media/timeline.py initial models
tests/unit/test_script_parser.py
tests/unit/test_utterances.py
tests/fixtures/scripts/
examples/pluralisation_cognitive_media/spoken_script.md
```

## M3.3 Controlled Markdown subset

Do not implement a full Markdown renderer.

Parse:

- YAML frontmatter;
- headings `#`, `##`, `###`;
- paragraphs;
- block quotes;
- ordered and unordered list items;
- fenced code blocks, which are excluded by default;
- approved media directives.

Define typed blocks:

```python
HeadingBlock
ParagraphBlock
QuoteBlock
ListBlock
PauseDirective
ChapterDirective
PronunciationDirective
ExcludedBlock
```

## M3.4 Required frontmatter

The spoken script must declare:

```yaml
script_id:
status: draft | approved
language:
source_repository:
source_path:
source_commit:
intermediate_product_path:
reviewed_by:
reviewed_at:
```

Rendering real speech is forbidden when `status != approved`, unless the selected provider is `mock` and the command includes `--allow-unapproved-mock`.

## M3.5 Text normalization

Mechanical normalization only:

- normalize line endings to LF;
- Unicode NFC normalization;
- collapse repeated spaces outside intentional pauses;
- replace typographic ellipsis consistently;
- remove Markdown emphasis markers while preserving words;
- exclude raw link targets from speech but preserve visible link text;
- retain apostrophes and French punctuation;
- expand configured pronunciations;
- never paraphrase automatically.

## M3.6 Sentence splitting

Implement a deterministic rule-based splitter adequate for French and English.

It must avoid splitting common abbreviations configured in a list, including:

```text
M.
Mme
Dr
Pr
etc.
p. ex.
i.e.
e.g.
```

The splitter does not need linguistic perfection. It needs deterministic behaviour and override directives.

## M3.7 Utterance model

```python
@dataclass(frozen=True)
class Utterance:
    id: str
    order: int
    chapter_id: str
    kind: Literal["heading", "body", "quote", "list_item"]
    display_text: str
    speech_text: str
    language: str
    pause_before_ms: int
    pause_after_ms: int
    source_line_start: int
    source_line_end: int
    text_sha256: str
```

Stable ID format:

```text
u-{order:04d}-{first_12_chars_of_text_hash}
```

Do not use random UUIDs.

## M3.8 Planning rules

- target 30–350 characters;
- merge tiny fragments when semantically adjacent;
- split long blocks at punctuation;
- headings create chapter IDs;
- explicit quote-card directive attaches to the next quote;
- code blocks require an explicit spoken alternative directive or are excluded;
- raw YAML frontmatter is never spoken;
- source notes marked `exclude-from-speech` remain in script but not utterances;
- preserve original order.

## M3.9 Outputs

Write:

```text
work/utterances.json
work/transcript.txt
work/plan_report.json
```

`plan_report.json` includes counts, excluded blocks, warnings, and estimated number of TTS requests.

## M3.10 CLI

Add:

```bash
ubikia-media plan PROJECT
```

It validates the project, parses the script, writes planning outputs, and performs no TTS call.

## M3.11 Tests

Cover:

- French punctuation;
- abbreviations;
- headings and chapter IDs;
- quote directives;
- code exclusion;
- unknown directive rejection;
- stable utterance IDs;
- source line tracking;
- unapproved script rejection for non-mock plan if configured;
- links spoken without URL;
- one-character source change affecting only relevant utterance IDs.

## M3.12 Acceptance criteria

- the example spoken script produces a stable utterance manifest;
- repeated execution yields identical JSON except allowed timestamps, preferably no timestamps in deterministic plan output;
- no model or LLM call is required;
- unknown directives fail loudly.

---

# M4 — TTS provider abstraction and utterance synthesis

## M4.1 Objective

Synthesize each utterance independently through a stable provider interface.

## M4.2 Files to create

```text
src/ubikia_media/providers/base.py
src/ubikia_media/providers/mock_tts.py
src/ubikia_media/providers/command_tts.py
src/ubikia_media/providers/__init__.py
src/ubikia_media/cache.py updates
tests/unit/test_mock_tts.py
tests/unit/test_command_tts.py
tests/integration/test_synthesize_mock.py
```

## M4.3 Provider models

```python
@dataclass(frozen=True)
class TTSCapabilities:
    supports_ssml: bool
    supports_rate: bool
    supports_pitch: bool
    returns_word_timings: bool
    output_sample_rates: tuple[int, ...]

@dataclass(frozen=True)
class SynthesisRequest:
    utterance_id: str
    text: str
    language: str
    voice: str
    rate: float
    pitch: float
    sample_rate_hz: int

@dataclass(frozen=True)
class SynthesisResult:
    provider_id: str
    output_path: Path
    duration_ms: int
    sample_rate_hz: int
    channels: int
    sha256: str
    provider_metadata: dict[str, JSONValue]
    text_left_local_machine: bool
```

## M4.4 Mock provider

The mock provider creates a valid mono PCM WAV for each utterance.

Duration rule must be deterministic, for example:

```text
max(600 ms, character_count × 35 ms)
```

Generate a quiet sine tone or silence with a short edge fade to avoid clicks.

The standard library `wave` module is sufficient.

Do not require NumPy solely for the mock provider.

## M4.5 Command provider

Configuration supports:

```yaml
tts:
  provider: command
  command:
    argv: ["program", "--output", "{output_wav}"]
    stdin: "{text}"
    timeout_seconds: 180
    environment:
      MODEL_PATH: "${MODEL_PATH}"
```

Allowed placeholders:

```text
{output_wav}
{text}
{voice}
{language}
{rate}
{pitch}
{sample_rate_hz}
{utterance_id}
```

Rules:

- prefer text over stdin;
- if `{text}` appears in argv, warn about command-line exposure and allow only with explicit `allow_text_in_argv: true`;
- output must exist after command success;
- output must be valid WAV;
- normalize provider WAV format later, not inside provider unless required;
- capture provider executable version through an optional version command;
- record whether text left local machine based on project declaration.

## M4.6 Synthesis orchestration

Implement:

```python
def synthesize_project(project: LoadedProject, force: bool = False) -> SynthesisManifest: ...
```

For each utterance:

1. compute cache key;
2. reuse valid cached WAV unless forced;
3. synthesize to temporary file;
4. probe WAV;
5. atomically move into `work/utterance_audio/`;
6. write per-utterance metadata;
7. continue after individual failure only when `--keep-going` is explicitly supported later; MVP stops on first failure;
8. write complete manifest only after all utterances succeed.

## M4.7 CLI

Add:

```bash
ubikia-media synthesize PROJECT [--force]
```

Optional global override:

```bash
--tts-provider mock|command
```

The override changes provider selection but does not mutate project YAML.

## M4.8 Tests

- mock WAV validity;
- deterministic duration;
- cache reuse;
- cache invalidation when text changes;
- safe command invocation;
- missing output file failure;
- invalid WAV failure;
- timeout handling;
- text-in-argv safety rule;
- no secret values in manifest or logs.

## M4.9 Acceptance criteria

- mock synthesis produces one WAV per example utterance;
- rerun uses cache and does not rewrite valid WAVs;
- modifying one utterance regenerates only that utterance;
- command provider can be tested with a Python fixture executable;
- failure leaves no completed synthesis manifest.

---

# M5 — Audio probing, assembly, normalization, and export

## M5.1 Objective

Create a valid narration master and podcast export from utterance WAV files.

## M5.2 Files to create

```text
src/ubikia_media/audio/probe.py
src/ubikia_media/audio/assemble.py
src/ubikia_media/audio/normalize.py
src/ubikia_media/audio/export.py
src/ubikia_media/audio/__init__.py
tests/unit/test_audio_probe.py
tests/integration/test_audio_assembly.py
```

## M5.3 FFmpeg dependency wrapper

All FFmpeg calls go through `subprocesses.py`.

Create a tool-discovery model containing:

- executable path;
- version string;
- supported encoders relevant to selected profile.

## M5.4 Probe model

```python
@dataclass(frozen=True)
class AudioProbe:
    duration_ms: int
    codec_name: str
    sample_rate_hz: int
    channels: int
    sample_format: str | None
```

Use `ffprobe -print_format json -show_streams -show_format` and parse JSON.

Reject files with zero or multiple audio streams in utterance inputs.

## M5.5 Canonical utterance format

Before concatenation, convert every utterance to:

```text
PCM signed 16-bit little endian
mono
48 kHz by default
WAV container
```

Store normalized clips under:

```text
work/utterance_audio_normalized/
```

Do not overwrite provider originals.

## M5.6 Pause generation

Generate silence clips deterministically with FFmpeg `anullsrc` or standard-library WAV.

Pause events are explicit timeline items.

## M5.7 Concatenation

Use FFmpeg concat demuxer with safely generated list files.

Do not construct one enormous shell command with unescaped paths.

Output pre-normalized master:

```text
work/audio/pre_normalized.wav
```

## M5.8 Loudness normalization

Use two-pass EBU R128 loudness normalization when available through FFmpeg `loudnorm`.

Default targets:

```text
I  = -16 LUFS
TP = -1.5 dBTP
LRA = 11 LU
```

Parse first-pass JSON and feed measured values into second pass.

If parsing fails, raise `RenderError`; do not silently fall back to unknown normalization.

Output:

```text
output/audio/master.wav
```

## M5.9 MP3 export

Export:

```text
output/audio/podcast.mp3
```

Defaults:

- mono;
- 128 kbps constant or high-quality constrained mode selected explicitly;
- ID3 title, artist, album, date, source URL where supported;
- no cover embedding until a cover image exists in M7.

## M5.10 Timeline

Record exact sequence:

```json
[
  {"kind":"utterance","id":"u-0001-...","start_ms":0,"end_ms":2100},
  {"kind":"pause","start_ms":2100,"end_ms":2700},
  {"kind":"utterance","id":"u-0002-...","start_ms":2700,"end_ms":5100}
]
```

Write `work/timeline.json` using measured normalized clip durations.

## M5.11 CLI

Add:

```bash
ubikia-media assemble-audio PROJECT [--force]
```

## M5.12 Tests

- ffprobe JSON parsing;
- one-stream validation;
- concatenation order;
- pause duration tolerance;
- output sample rate and channels;
- master duration equals timeline within 100 ms;
- loudness command generation;
- MP3 exists and decodes;
- metadata does not include unresolved placeholders.

Integration tests skip with an explicit message when FFmpeg is unavailable.

## M5.13 Acceptance criteria

- mock utterances build a valid master WAV and MP3;
- timeline is monotonic;
- output duration is positive and consistent;
- original provider WAVs are preserved;
- repeat build is skipped when inputs and checksums match.

---

# M6 — Captions and transcript

## M6.1 Objective

Generate readable, monotonic SRT and WebVTT captions from the actual audio timeline.

## M6.2 Files to create

```text
src/ubikia_media/captions/models.py
src/ubikia_media/captions/split.py
src/ubikia_media/captions/srt.py
src/ubikia_media/captions/vtt.py
src/ubikia_media/captions/validate.py
src/ubikia_media/captions/__init__.py
tests/unit/test_caption_split.py
tests/unit/test_srt.py
tests/unit/test_vtt.py
tests/unit/test_caption_validate.py
```

## M6.3 Cue model

```python
@dataclass(frozen=True)
class CaptionCue:
    index: int
    start_ms: int
    end_ms: int
    lines: tuple[str, ...]
    utterance_id: str
```

## M6.4 Cue splitting

Default one cue per utterance.

If display text exceeds configured limits:

1. split at punctuation or whitespace;
2. allocate utterance duration proportionally by weighted character count;
3. preserve minimum cue duration where possible;
4. never overlap;
5. preserve total utterance interval exactly;
6. maximum two lines per cue;
7. wrap near 42 characters per line by default.

Do not use speech recognition to regenerate captions in MVP. The approved script is the caption source.

## M6.5 Outputs

```text
output/captions/captions.srt
output/captions/captions.vtt
output/transcript/transcript.txt
output/transcript/transcript.md
```

Markdown transcript includes chapter headings and source links.

## M6.6 Validation

Validate:

- cue indexes sequential;
- start < end;
- no overlap;
- timestamps within audio duration;
- no empty cue;
- valid UTF-8;
- no line exceeds configured hard maximum without warning;
- final cue ends no later than audio duration plus 100 ms.

## M6.7 CLI

Add:

```bash
ubikia-media captions PROJECT [--force]
```

## M6.8 Tests

Test timestamp formatting above one hour, accented French text, line wrapping, proportional timing, short utterances, long utterances, monotonic validation, and exact total interval preservation.

## M6.9 Acceptance criteria

- example captions open in standard players;
- SRT and VTT contain the same cue text and timings;
- captions derive only from approved utterances;
- no cue overlap.

---

# M7 — Scene planning and deterministic card rendering

## M7.1 Objective

Create an automatic but restrained visual layer suitable for a spoken essay.

## M7.2 Files to create

```text
src/ubikia_media/visuals/models.py
src/ubikia_media/visuals/scene_plan.py
src/ubikia_media/visuals/layout.py
src/ubikia_media/visuals/cards.py
src/ubikia_media/visuals/__init__.py
tests/unit/test_scene_plan.py
tests/unit/test_layout.py
tests/integration/test_card_render.py
examples/pluralisation_cognitive_media/assets/README.md
```

## M7.3 Scene types

```python
CoverScene
ChapterScene
QuoteScene
BodyScene
ProvenanceScene
ClosingScene
ImageScene  # only for explicitly supplied approved assets
```

## M7.4 Default scene plan

- cover: at least 4 seconds and through first short introduction;
- chapter scene: begins at heading utterance and lasts until next body interval, minimum 3 seconds;
- quote scene: for marked quotations, covers quotation interval;
- body scene: displays chapter title plus one short key phrase;
- provenance scene: near ending, shows source repository/path and article URL if available;
- closing scene: final 4–8 seconds, includes title and source.

The planner must ensure continuous coverage from 0 to audio duration.

No gap and no overlap are permitted.

## M7.5 Display-text rules

- never display more than 240 characters on a body card;
- quote cards maximum 320 characters;
- preserve explicit display text when provided;
- otherwise use deterministic first-clause extraction;
- do not claim that displayed excerpts are verbatim when mechanically shortened; mark ellipsis;
- headings are displayed verbatim;
- source URLs may be shortened visually but full values remain in metadata.

## M7.6 Theme model

Support:

```yaml
visuals:
  theme:
    background: "#111111"
    foreground: "#F5F5F5"
    muted: "#B0B0B0"
    accent: "#D7A84B"
    font_family: "DejaVu Sans"
    title_font_path: null
    body_font_path: null
    safe_margin_px: 120
    footer_height_px: 90
```

Use Pillow colour parsing and reject invalid colours.

If configured fonts cannot be found, fail with a clear dependency/configuration error. Do not silently substitute an unknown font in production mode. A deterministic test font available in common CI images may be selected for fixtures, but font files must not be committed unless licence permits and human approval exists.

## M7.7 Layout engine

Implement reusable functions:

```python
def wrap_text(text: str, font: ImageFont, max_width: int) -> list[str]: ...
def fit_font_size(text: str, box: Rect, font_loader: FontLoader, max_size: int, min_size: int) -> FittedText: ...
def render_scene(scene: Scene, profile: VideoProfile, theme: VisualTheme, output: Path) -> RenderedCard: ...
```

Layout must:

- respect safe margins;
- avoid clipping;
- vertically center primary content when appropriate;
- reserve footer for source or chapter;
- produce deterministic results;
- include alt-text metadata in scene manifest.

## M7.8 Outputs

```text
work/scenes.json
work/cards/scene-0001.png
work/cards/scene-0002.png
...
output/images/cover_landscape.png
output/images/thumbnail_landscape.png
```

The cover and thumbnail may initially be the same image.

## M7.9 CLI

Add:

```bash
ubikia-media render-scenes PROJECT [--force]
```

## M7.10 Tests

- continuous scene coverage;
- deterministic plan;
- no negative durations;
- card dimensions exact;
- text bounding boxes remain inside safe area;
- long title reduction to minimum font size then clear error if still impossible;
- supplied asset outside project root rejected unless declared read-only source asset;
- missing font error.

## M7.11 Acceptance criteria

- example project generates all landscape cards;
- no text clipping according to measured bounds;
- source/provenance card exists;
- scene manifest covers full audio duration;
- no generative service required.

---

# M8 — Landscape video rendering

## M8.1 Objective

Create a broadly compatible 1080p video from scenes, captions, and narration.

## M8.2 Files to create

```text
src/ubikia_media/video/profiles.py
src/ubikia_media/video/render.py
src/ubikia_media/video/probe.py
src/ubikia_media/video/__init__.py
tests/unit/test_video_profiles.py
tests/unit/test_ffmpeg_commands.py
tests/integration/test_video_render.py
```

## M8.3 Profile

Implement `landscape_1080p`:

```yaml
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

Validate requested encoders through FFmpeg capability inspection.

## M8.4 Rendering algorithm

Recommended MVP algorithm:

1. for each PNG scene, create an intermediate MP4 segment with exact duration and no audio;
2. enforce identical codec, resolution, fps, time base, and pixel format;
3. concatenate video segments using concat demuxer;
4. mux narration master as AAC;
5. burn SRT captions into a final copy when configured;
6. retain a no-burn master if storage policy allows;
7. set `-movflags +faststart`;
8. write final output atomically.

Alternative single-filter-complex implementations are allowed only if equally testable and maintainable. Simplicity takes priority over one-command cleverness.

## M8.5 Subtitle escaping

Subtitle paths and fonts are common FFmpeg failure points.

Create a dedicated escaping function tested on:

- spaces;
- apostrophes;
- Windows drive letters;
- backslashes;
- colons;
- non-ASCII characters.

Where practical, use a temporary working directory with simple filenames.

## M8.6 Output

```text
output/video/landscape_1080p.mp4
```

Optional internal output:

```text
work/video/landscape_1080p_no_captions.mp4
```

## M8.7 Probe model

```python
@dataclass(frozen=True)
class VideoProbe:
    duration_ms: int
    width: int
    height: int
    fps: Fraction
    video_codec: str
    pixel_format: str
    audio_codec: str
    audio_sample_rate_hz: int
    audio_channels: int
```

## M8.8 CLI

Add:

```bash
ubikia-media render-video PROJECT --profile landscape_1080p [--force]
```

## M8.9 Tests

- profile validation;
- FFmpeg command construction;
- exact output dimensions;
- one video and one audio stream;
- yuv420p output;
- duration difference from audio under 250 ms;
- faststart flag indirectly checked where possible;
- captions visible is hard to automate fully, but verify subtitle filter used and resulting file decodes;
- failed render leaves no final output.

## M8.10 Acceptance criteria

- example project produces playable MP4;
- duration matches narration;
- cards cover entire video;
- captions sidecars exist and burned-caption output decodes;
- video rendering can resume without rebuilding unchanged audio.

---

# M9 — Quality control and artifact manifests

## M9.1 Objective

Produce machine-readable evidence that artifacts meet the declared project profile.

## M9.2 Files to create

```text
src/ubikia_media/qc/checks.py
src/ubikia_media/qc/report.py
src/ubikia_media/qc/__init__.py
schemas/media_artifact.schema.yaml
tests/unit/test_qc.py
tests/integration/test_qc_end_to_end.py
```

## M9.3 Check model

```python
@dataclass(frozen=True)
class QCCheck:
    id: str
    severity: Literal["info", "warning", "error"]
    passed: bool
    message: str
    evidence: dict[str, JSONValue]
```

## M9.4 Required checks

### Configuration

- project schema valid;
- source commit not empty or explicitly marked pending;
- script approved for real TTS;
- no unresolved environment variables in public metadata.

### Audio

- master decodes;
- expected sample rate and channels;
- positive duration;
- timeline duration tolerance;
- MP3 decodes;
- loudness normalization metadata recorded.

### Captions

- SRT valid;
- VTT valid;
- cue timelines monotonic;
- final cue within duration;
- no empty text.

### Visuals

- scene coverage continuous;
- all cards exist;
- dimensions correct;
- alt text present for cover and thumbnail.

### Video

- expected resolution;
- expected codec and pixel format;
- exactly one video and one audio stream;
- duration tolerance;
- checksum computed.

### Provenance

- source, intermediate product, script, project, tool version, provider, and render profile recorded;
- `text_left_local_machine` declared;
- external assets include rights metadata.

## M9.5 Reports

Write:

```text
output/manifests/artifacts.json
output/manifests/qc.json
output/manifests/build.json
```

`artifacts.json` validates against `schemas/media_artifact.schema.yaml`.

## M9.6 Status rule

Package readiness requires no failed `error` checks.

Warnings are allowed but listed prominently.

## M9.7 CLI

`inspect` shows current stage, artifacts, checksums, duration, provider, and review status.

```bash
ubikia-media inspect PROJECT
ubikia-media inspect PROJECT --json
```

## M9.8 Tests

- deliberate checksum mismatch;
- wrong video dimensions;
- caption overlap;
- missing provenance field;
- warning-only report remains packageable;
- error report blocks package command.

## M9.9 Acceptance criteria

- all example artifacts listed with SHA-256;
- QC report is stable and readable;
- package generation refuses failed QC;
- inspect never prints secrets.

---

# M10 — Platform package generation

## M10.1 Objective

Create manual-publication directories for podcast, YouTube, Facebook, and LinkedIn.

## M10.2 Files to create

```text
src/ubikia_media/packaging/profiles.py
src/ubikia_media/packaging/package.py
src/ubikia_media/packaging/__init__.py
tests/unit/test_package_profiles.py
tests/integration/test_packages.py
```

## M10.3 Package profiles

### Podcast

```text
podcast.mp3
cover.png
transcript.txt
transcript.md
episode.yaml
README.txt
```

`episode.yaml` fields:

```yaml
title:
subtitle:
author:
language:
description:
source_url:
article_url:
duration_seconds:
explicit: false
keywords: []
publication_status: ready_for_manual_publication
```

### YouTube

```text
video.mp4
thumbnail.png
captions.srt
captions.vtt
description.txt
chapters.txt
metadata.yaml
README.txt
```

Description includes:

- public summary;
- source link;
- article link if available;
- synthetic voice disclosure when relevant;
- licence or rights note;
- chapter markers.

### Facebook video

```text
video.mp4
captions.srt
post.txt
metadata.yaml
README.txt
```

### LinkedIn video

```text
video.mp4
captions.srt
post.txt
metadata.yaml
README.txt
```

The package generator may use project-provided announcement text. It must not call an LLM to invent it in the MVP.

## M10.4 Ledger stub

Generate, but do not automatically merge into the global ledger:

```text
output/packages/publication_ledger_stub.yaml
```

One entry per target:

```yaml
- publication_id: pending
  project_id: pluralisation-cognitive-media-v1
  artifact_id: landscape-video-v1
  platform: youtube
  status: ready_for_manual_publication
  publication_url: null
  published_at: null
  human_approval_required: true
```

## M10.5 CLI

```bash
ubikia-media package PROJECT --profile podcast
ubikia-media package PROJECT --profile youtube
ubikia-media package PROJECT --profile facebook_video
ubikia-media package PROJECT --profile linkedin_video
```

`build` may package all targets listed in project YAML.

## M10.6 Tests

- required package files exist;
- no package file points to work-directory internals;
- metadata has source provenance;
- package refuses failed QC;
- package remains `ready_for_manual_publication`, never `published`;
- repeated packaging is idempotent;
- outdated package is rebuilt when artifact checksum changes.

## M10.7 Acceptance criteria

- four package directories created for example;
- each has a short manual-publication README;
- ledger stub is valid YAML;
- no network calls occur.

---

# M11 — End-to-end example and release readiness

## M11.1 Objective

Prove the full pipeline using the pluralisation cognitive article family.

## M11.2 Source references

Use immutable source commit:

```text
repository: JeanHuguesRobert/barons-Mariani
commit: 19dbb4a4e30dff10d2049730a34ab5a9d62bb7f5
source: research/pluralisation_cognitive_sous_mandat.md
intermediate: research/se_demultiplier_pour_explorer_le_possible_blogpost.md
```

The local example spoken script is a derived test product. It must declare those source references.

## M11.3 Files to complete

```text
examples/pluralisation_cognitive_media/project.yaml
examples/pluralisation_cognitive_media/spoken_script.md
examples/pluralisation_cognitive_media/assets/README.md
README.md update
docs/media_pipeline.md links verified
docs/media_agent_runbook.md links verified
```

## M11.4 End-to-end command

```bash
ubikia-media build examples/pluralisation_cognitive_media/project.yaml \
  --tts-provider mock
```

Expected stages:

```text
validate
plan
synthesize
assemble-audio
captions
render-scenes
render-video
qc
package
```

## M11.5 Build orchestration

`build` must:

- stop on first failing stage;
- show stage progress;
- reuse valid completed stages;
- honour `--force` by rebuilding all stages;
- support a future `--from-stage` extension but need not implement it in MVP;
- write build report even on failure, marked incomplete;
- return the correct exit code.

## M11.6 Documentation

README must show:

```bash
python -m pip install -e '.[dev]'
ubikia-media doctor
ubikia-media validate examples/pluralisation_cognitive_media/project.yaml
ubikia-media build examples/pluralisation_cognitive_media/project.yaml --tts-provider mock
```

Document real command-provider configuration separately and state that provider installation is external.

## M11.7 Test suite

Required commands:

```bash
ruff format --check .
ruff check .
pytest -q
```

Optional when FFmpeg available:

```bash
pytest -q -m integration
```

Add a CI workflow only if consistent with repository governance and human scope approval. The documentation task alone must not silently add GitHub Actions.

## M11.8 Acceptance criteria

MVP is complete when:

- all unit tests pass;
- FFmpeg integration tests pass on a machine with FFmpeg;
- example build produces WAV, MP3, SRT, VTT, PNG cards, MP4, manifests, QC report, and four packages;
- second identical build reuses stages;
- changing one sentence regenerates only affected utterance audio and downstream dependent stages;
- no upload occurs;
- all outputs retain source commit provenance;
- human review remains required before publication.

---

# M12 — Optional post-MVP vertical excerpt foundation

M12 is not required for MVP completion.

## M12.1 Objective

Create a reviewed 30–90 second excerpt and render it vertically.

## M12.2 Required conceptual caution

Excerpt selection changes emphasis. It is an editorial act, not merely transcoding.

The excerpt manifest must identify:

- selected utterance IDs;
- selection method;
- omitted context warning where relevant;
- human reviewer;
- approval status.

## M12.3 Proposed files

```text
src/ubikia_media/excerpts/select.py
src/ubikia_media/excerpts/models.py
src/ubikia_media/video/vertical.py
```

## M12.4 Initial method

MVP+1 should use explicit human-selected utterance ranges, not AI ranking.

Profile:

```yaml
width: 1080
height: 1920
fps: 30
max_duration_seconds: 90
captions: burned
```

## M12.5 Later extension

Automatic candidate selection may propose excerpts based on:

- marked quotations;
- chapter boundaries;
- duration bounds;
- sentence completeness.

It may not publish or approve its own selection.

---

# 6. Cross-cutting implementation rules

## 6.1 Logging

- default concise human logs;
- `--verbose` for command details;
- `--debug` for traceback;
- structured build report always written;
- secret redaction mandatory;
- do not log complete private source text.

## 6.2 Error messages

Every user-facing error should include:

```text
what failed
which project or artifact was affected
likely corrective action
whether prior completed stages remain reusable
```

## 6.3 Time and timestamps

- use UTC ISO 8601 in generated manifests;
- use integer milliseconds for media timelines;
- never use floating-point seconds as canonical timeline storage;
- convert only at FFmpeg boundaries.

## 6.4 JSON typing

Define a reusable JSON type alias rather than using unrestricted `Any` in public models.

## 6.5 Backward compatibility

Every project file declares:

```yaml
schema_version: "0.1"
```

Reject unknown major versions. Future minor migrations must be explicit.

## 6.6 Testing philosophy

Unit tests validate deterministic logic without FFmpeg.

Integration tests validate external tools with short fixtures.

Do not commit long media binaries. Generate short fixtures at test runtime or commit only tiny rights-safe samples after explicit approval.

## 6.7 Security

- no `shell=True`;
- no arbitrary Python evaluation from YAML;
- no implicit network downloads;
- no path escape for generated files;
- no secrets in manifests;
- no publication credentials in MVP;
- no voice-cloning support in MVP;
- no processing of private repositories in public CI fixtures.

## 6.8 Performance

MVP performance goals are modest:

- plan a 20-minute script in under 2 seconds excluding filesystem latency;
- cache unchanged utterances;
- avoid loading full media files into memory;
- stream hashes;
- use FFmpeg for media transforms;
- keep static-card rendering bounded.

## 6.9 Windows compatibility

The user works on Windows as well as Linux infrastructure.

Therefore:

- use `pathlib`;
- never assume `/tmp`;
- avoid shell syntax;
- test path escaping with Windows-like paths;
- keep command arguments as arrays;
- document FFmpeg PATH requirements;
- avoid filenames containing characters invalid on Windows;
- use UTF-8 explicitly.

## 6.10 Reversibility

Generated directories may be deleted and rebuilt.

Source scripts and project manifests are never deleted by `clean`.

`clean --stage` may remove only known generated paths recorded in state manifests.

It must refuse arbitrary path deletion.

# 7. Task completion report template

Every coding agent must end a task with:

```text
Task ID:
Scope implemented:
Files created:
Files modified:
Tests added or changed:
Commands run:
Results:
Known limitations:
Architecture deviations: none | describe
Generated artifacts committed: no | explain
Human validation required:
Recommended next task:
```

# 8. Definition of done

The implementation is not done when it can produce one video once.

It is done when the pipeline is:

- source-linked;
- deterministic where possible;
- resumable;
- testable;
- provider-independent;
- safe on paths and subprocesses;
- accessible through captions and transcripts;
- explicit about synthetic voice;
- manually publishable through prepared packages;
- incapable of silently publishing;
- understandable by the next coding agent.
