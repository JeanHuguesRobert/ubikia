---
document_role: "orientation"
document_kind: "media-subsystem-index"
visibility: "public"
lifecycle_state: "working"
date: "2026-07-12"
---

# Ubikia Media

Ubikia Media is the planned audio and audiovisual rendering subsystem of Ubikia.

It turns an approved source-derived editorial product into traceable media artifacts and manual-publication packages.

```text
source corpus
→ approved editorial product
→ spoken script
→ utterance audio
→ narration master
→ captions
→ visual scenes
→ video master
→ platform packages
→ manual publication
→ ledger
→ return to corpus
```

## Start here

- [`docs/media_pipeline.md`](docs/media_pipeline.md) — architecture, vocabulary, invariants, media stages and extension points.
- [`docs/media_mvp_implementation_plan.md`](docs/media_mvp_implementation_plan.md) — detailed milestones M0–M12, exact files, interfaces, tests and acceptance criteria.
- [`docs/media_agent_runbook.md`](docs/media_agent_runbook.md) — mandatory execution discipline for coding agents.
- [`schemas/media_project.schema.yaml`](schemas/media_project.schema.yaml) — human-authored project contract.
- [`schemas/media_artifact.schema.yaml`](schemas/media_artifact.schema.yaml) — generated artifact-manifest contract.
- [`examples/pluralisation_cognitive_media/project.yaml`](examples/pluralisation_cognitive_media/project.yaml) — first reference project.
- [`examples/pluralisation_cognitive_media/spoken_script.md`](examples/pluralisation_cognitive_media/spoken_script.md) — draft spoken adaptation of the first target article.

## First implementation instruction

A coding agent should begin with M0 only.

Recommended prompt:

```text
Repository: JeanHuguesRobert/ubikia

Implement task M0 only from docs/media_mvp_implementation_plan.md.
Follow AGENTS.md and docs/media_agent_runbook.md.
Do not continue to M1.
Add the specified tests and run the required checks.
Do not add network services, publication automation, voice cloning, generative imagery, or generated media binaries.
End with the exact completion report from the runbook.
```

## MVP boundary

The first MVP prepares files locally. It does not publish externally.

Expected outputs after M11:

```text
WAV narration master
MP3 podcast export
SRT captions
WebVTT captions
text and Markdown transcripts
PNG cover and scene cards
1080p landscape MP4
podcast package
YouTube package
Facebook video package
LinkedIn video package
QC report
artifact manifest
publication-ledger stub
```

> Automate rendering. Preserve authorship, provenance, and human control.
