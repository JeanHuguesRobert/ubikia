---
document_role: "operational"
document_kind: "agent-runbook"
visibility: "public"
lifecycle_state: "working"
version: "0.1"
date: "2026-07-12"
repository: "JeanHuguesRobert/ubikia"
related_documents:
  - "AGENTS.md"
  - "docs/media_pipeline.md"
  - "docs/media_mvp_implementation_plan.md"
---

# Ubikia Media — Coding-Agent Runbook
## How to implement the MVP safely, one bounded task at a time

## 1. Mandate

This runbook is for coding agents implementing Ubikia Media.

The agent must not redesign the project unless the user explicitly requests a redesign.

The authoritative implementation order and task details are in:

```text
docs/media_mvp_implementation_plan.md
```

The architecture and vocabulary are in:

```text
docs/media_pipeline.md
```

Repository-wide governance is in:

```text
AGENTS.md
```

Priority order in case of ambiguity:

```text
explicit human instruction
→ AGENTS.md
→ media_mvp_implementation_plan.md
→ media_pipeline.md
→ existing code and tests
→ agent preference
```

## 2. One task per run

A coding run must target exactly one task ID, for example:

```text
M0
M1
M4.5
M8.4
```

If no task ID is supplied:

1. inspect current repository state;
2. determine the earliest incomplete task whose dependencies are complete;
3. report the proposed task;
4. implement only that task if the user has asked for implementation rather than planning.

Do not implement several milestones because they seem related.

A task should produce a reviewable diff.

## 3. Mandatory preflight

Before editing:

```bash
git status --short --branch
```

Then read:

```text
AGENTS.md
docs/media_pipeline.md
docs/media_mvp_implementation_plan.md
```

Then inspect:

- files named by the task;
- existing tests in the same area;
- `pyproject.toml` if it exists;
- current branch and uncommitted changes;
- preceding task outputs.

Stop before editing if:

- the working tree contains unrelated changes whose ownership is unclear;
- a required preceding task is absent;
- the specification conflicts with current code in a consequential way;
- the task would require adding publication credentials;
- the task would require copying private source material into this public repository;
- the requested action would publish externally.

## 4. Bounded implementation procedure

Use this sequence for every task.

### Step 1 — Restate the task contract

Privately or in the work note, identify:

```text
Task ID
Objective
Files expected
Dependencies
Tests required
Acceptance criteria
Explicit non-goals
```

### Step 2 — Inspect before creating

Search for existing equivalent modules or conventions.

Do not create duplicate abstractions because search was skipped.

### Step 3 — Implement smallest complete slice

Implement only enough to satisfy the current task acceptance criteria.

Avoid speculative abstractions that are not required by a documented extension point.

### Step 4 — Add tests with the code

A code task without corresponding tests is incomplete unless the task explicitly concerns documentation only.

### Step 5 — Run narrow tests first

Example:

```bash
pytest -q tests/unit/test_config.py
```

Then run repository-wide checks required by the task.

### Step 6 — Inspect the diff

```bash
git diff --check
git diff --stat
git diff
```

Check for:

- accidental unrelated edits;
- secrets;
- generated binaries;
- private content;
- debug prints;
- TODOs that conceal required behaviour;
- architecture deviations;
- platform publishing code.

### Step 7 — Report and stop

Use the completion report template in this runbook.

Do not start the next task automatically.

## 5. Implementation discipline

### 5.1 Prefer explicit types

Use dataclasses or Pydantic models for public data structures.

Avoid dictionaries whose keys are known by convention but not validated.

Bad:

```python
result = {"duration": 12.4, "whatever": value}
```

Preferred:

```python
@dataclass(frozen=True)
class AudioProbe:
    duration_ms: int
    sample_rate_hz: int
    channels: int
```

### 5.2 Preserve milliseconds as integers

Canonical timeline values are integer milliseconds.

Do not store canonical times as floats.

Bad:

```python
start = 1.3333333
```

Preferred:

```python
start_ms = 1333
```

Convert to seconds only when building an FFmpeg command.

### 5.3 Never use shell interpolation

Bad:

```python
subprocess.run(f"ffmpeg -i {path} {output}", shell=True)
```

Required:

```python
subprocess.run([
    "ffmpeg",
    "-i",
    str(path),
    str(output),
], check=False)
```

All subprocesses must pass through the shared wrapper once M2 exists.

### 5.4 Keep editorial transformations explicit

Rendering code must not paraphrase or summarize narration.

If a requested implementation needs editorial adaptation, produce or modify a declared spoken-script artifact and require review.

### 5.5 Do not infer approval

File existence does not mean approval.

Only explicit status fields or explicit human instruction may mark a script or artifact approved.

### 5.6 Do not add automatic uploads

No task in M0–M11 uploads to YouTube, podcast hosting, Facebook, Instagram, LinkedIn, X, Substack, or any other platform.

A package with status `ready_for_manual_publication` is the maximum allowed output.

### 5.7 Do not add voice cloning

Generic TTS and command-provider support are allowed.

Voice cloning requires a separate doctrine, authorization, provider assessment, and human validation.

### 5.8 Keep secrets outside configuration files

Secrets come from environment variables or future secret managers.

Never commit:

- API keys;
- access tokens;
- cookies;
- publication credentials;
- private model licences;
- private source excerpts.

### 5.9 Avoid large binary fixtures

Unit tests should generate tiny WAV and PNG fixtures at runtime.

Do not commit long audio or video files.

### 5.10 Respect Windows and Linux

- use `pathlib.Path`;
- specify UTF-8;
- avoid shell syntax;
- test path handling independently of separator style;
- avoid colon and reserved characters in generated filenames;
- do not assume `/tmp`;
- use `tempfile`.

## 6. Dependency rule

Before adding a dependency, document:

```text
name
purpose
why standard library is insufficient
licence if relevant
runtime or dev-only
maintenance risk
```

Do not add a dependency merely to save a few lines.

Do not implement custom media codecs or loudness algorithms when FFmpeg already provides the needed primitive.

## 7. Test rules

### 7.1 Unit tests

Unit tests must not require:

- network access;
- API credentials;
- real TTS services;
- publication platforms;
- long-running media generation.

### 7.2 Integration tests

FFmpeg integration tests must:

- generate short fixtures;
- complete quickly;
- skip clearly when FFmpeg is unavailable;
- leave temporary files inside pytest temporary directories;
- validate streams with ffprobe.

### 7.3 Determinism tests

Where deterministic output is required, run the operation twice and compare:

- manifest contents;
- stable IDs;
- checksums when byte determinism is expected;
- stage reuse behaviour.

### 7.4 Failure tests

Every external boundary needs failure tests:

- missing executable;
- timeout;
- non-zero return;
- missing output;
- invalid media output;
- unsafe path;
- stale cache;
- malformed YAML;
- unsupported schema version.

### 7.5 Test naming

Prefer names that state behaviour:

```python
def test_validate_rejects_output_path_outside_project_root(): ...
def test_command_provider_does_not_use_shell(): ...
def test_caption_cues_never_overlap(): ...
```

## 8. Task dependency matrix

```text
M0 → none
M1 → M0
M2 → M1
M3 → M1, M2
M4 → M2, M3
M5 → M2, M4
M6 → M3, M5
M7 → M3, M5
M8 → M5, M6, M7
M9 → M5, M6, M7, M8
M10 → M9
M11 → M0–M10
M12 → M6, M7, M8, M9, M10
```

Do not implement a task when a dependency is absent or failing.

## 9. How to determine whether a task is complete

For each task, locate the acceptance criteria in the implementation plan.

Create a checklist and verify every item.

Example:

```text
M4 acceptance
[ ] mock provider creates valid WAV
[ ] repeat build reuses cache
[ ] text change invalidates one utterance
[ ] command provider tested with fixture executable
[ ] failures do not create complete manifest
```

If one item is not met, the task is not complete.

Do not reclassify missing criteria as future work without human approval.

## 10. Architecture deviation protocol

Sometimes implementation reveals a flaw in the specification.

Do not silently choose a different design.

Report:

```text
Specification location:
Observed conflict:
Minimal evidence:
Options:
Recommended change:
Files affected:
Backward-compatibility effect:
Human decision required:
```

A small implementation detail may be resolved locally if it preserves all invariants and public contracts.

A change to data models, CLI contract, publication boundary, provenance, security, or approval semantics requires explicit review.

## 11. Generated file policy

Generated files belong under project `work/` or `output/` directories.

They should be ignored by Git unless they are:

- tiny deterministic test fixtures;
- example manifests deliberately committed;
- documentation screenshots explicitly approved;
- schema examples.

Never commit:

- generated WAV masters;
- MP3 episodes;
- MP4 videos;
- provider cache;
- API responses containing secrets;
- personal private media.

## 12. Source and privacy protocol

The example project references public source documents in `barons-Mariani`.

When an implementation task needs source text:

- use the approved example spoken script;
- do not scrape or mirror unrelated source files;
- preserve source commit metadata;
- do not import private repository content;
- do not assume that a locally readable file is publishable.

## 13. Real TTS provider protocol

The MVP core includes `mock` and `command` providers.

A coding agent implementing the command provider must test it with a local fixture program, not a live vendor.

A separate human-controlled configuration may later point the command adapter to a real engine.

The agent must not:

- sign up for a service;
- create accounts;
- transmit source text externally without explicit configuration;
- embed provider credentials;
- claim a provider is local when it sends text to a network service.

Provider manifest field:

```yaml
text_left_local_machine: true | false
```

must be explicit.

## 14. FFmpeg command protocol

Every FFmpeg or ffprobe call must be inspectable.

The shared wrapper records:

- redacted argv;
- return code;
- elapsed time;
- bounded stdout and stderr;
- tool version;
- stage name.

Avoid excessively clever filter graphs.

For the MVP, several simple, validated commands are preferable to one opaque command.

Temporary files should have simple ASCII names to reduce subtitle and concat escaping problems.

## 15. Review checkpoints

Human review is specifically required after:

```text
spoken script preparation
first real voice synthesis
first complete audio master
first complete visual theme
first complete video
first platform package
any change to publication automation level
any introduction of voice cloning
any introduction of generative imagery
```

Code tests do not replace those editorial reviews.

## 16. Clean command safety

When implementing `clean`:

- accept only enumerated stage names;
- derive removable paths from generated state;
- display planned deletions with `--dry-run` support before destructive use if feasible;
- refuse source script and project manifest deletion;
- refuse paths outside project root;
- refuse unknown files not owned by a stage;
- never run recursive deletion on a user-supplied arbitrary path.

## 17. Performance troubleshooting

If a task is slow:

1. identify the stage;
2. measure before optimizing;
3. check whether cache reuse is functioning;
4. avoid loading media files entirely into Python memory;
5. let FFmpeg stream media;
6. do not add concurrency until correctness and atomic state are stable.

Parallel TTS synthesis is a later optimization. The MVP may synthesize sequentially.

## 18. Completion report

Use this exact structure:

```text
Task ID:

Scope implemented:

Files created:
- 

Files modified:
- 

Tests added or changed:
- 

Commands run:
- 

Results:
- 

Acceptance criteria:
- [x] 
- [ ] 

Known limitations:
- 

Architecture deviations:
- none

Generated media committed:
- no

Privacy or secret review:
- no secrets added
- no private material added

Human validation required:
- 

Recommended next task:
- 
```

If any criterion remains unchecked, state that the task is incomplete.

## 19. Minimal prompt for a coding agent

A human may use this pattern:

```text
Repository: JeanHuguesRobert/ubikia

Implement task M3 only from docs/media_mvp_implementation_plan.md.
Follow AGENTS.md and docs/media_agent_runbook.md.
Do not continue to M4.
Add the specified tests and run the required checks.
Do not add network services, publication automation, voice cloning, or generated media binaries.
End with the exact completion report from the runbook.
```

## 20. Closing rule

The objective is not to reward an agent for producing the largest diff.

The objective is to make every step:

- bounded;
- inspectable;
- testable;
- reversible;
- source-linked;
- safe to hand to the next agent.

> Implement one capability. Prove it. Report it. Stop.
