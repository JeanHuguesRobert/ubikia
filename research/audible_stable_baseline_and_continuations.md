---
title: "Audible stable baseline and deferred continuations"
document_role: "operational"
document_kind: "continuation"
visibility: "public"
lifecycle_state: "active"
status: "handoff"
date: "2026-07-19"
author: "Jean Hugues Noël Robert"
repository: "ubikia"
purpose: "Allow a future human or agent to resume efficiently without replaying the 2026-07 conversation."
related_documents:
  - "ubikia/docs/audible.md"
  - "ubikia/docs/audible-youtube-workflow.md"
  - "ubikia/publications/README.md"
  - "ubikia/publications/ledger/publications.json"
  - "ubikia/research/publication_registry_exploration.md"
  - "ubikia/AGENTS.md"
---

# Audible stable baseline and deferred continuations

**Status:** stable enough to stop the current work stream.  
**Not done here:** implement the deferred packages below — only make them *cheap to resume*.

## 1. Stable baseline (do not re-derive)

As of 2026-07-19 on `main`:

| Capability | Where |
|------------|--------|
| Governed spoken adaptation + review + render/assemble/package | `docs/audible.md`, `cli/audible-*.js`, `src/audible/` |
| Provider-neutral TTS (Gradium default, Cartesia second) | `src/audible/providers/`, issue #19 closed via PR #20 |
| Partial multi-provider completion + `--force-rerender` | `src/audible/render.js`, `docs/audible.md` |
| Manual YouTube path + human record | `docs/audible-youtube-workflow.md`, `cli/audible-record-youtube.js` |
| Versioned URL memory | `publications/ledger/publications.json` |
| Platform-as-backup doctrine | `publications/README.md` |
| Explorable registry (study only) | `research/publication_registry_exploration.md` |

### Live public appearances (ledger is authoritative in-repo)

| Slug / title | URL |
|--------------|-----|
| `on-nest-jamais-si-bien-servi` | https://youtu.be/mjdHmPvNmB0 |
| `le-pere-noel-revient` | https://youtu.be/BklzkGmP0HI |

### Local workshops (this machine only; gitignored)

```text
artifacts/audible/on-nest-jamais-si-bien-servi/
artifacts/audible/le-pere-noel-revient/
```

If missing later: recover public scene from YouTube + ledger; rebuild media with credentials + pipeline. Do not expect binaries in Git.

### Closed work (do not reopen without new scope)

- Issue #17 — reference episode published
- Issue #19 — multi-provider TTS on main
- PR #18 draft — superseded; PR #20 merged

## 2. Operational facts worth keeping

These were learned the hard way; they are partly in docs — restated here for cold resume:

1. **Windows / npm:** prefer `node --env-file=.env cli/...` when flags like `--provider` are swallowed by npm.
2. **Quota / empty segment:** Gradium can return header-only WAV or 402; empty PCM is rejected; complete gaps with another provider (default resume reuses valid segments).
3. **Mixed voice:** may be kept as honest synthetic signal; use `--force-rerender --provider <id>` only when unity is preferred.
4. **Secrets:** only in local `.env`; `.env.example` lists names without values; never commit keys.
5. **Source path discrepancy** for Père Noël: published path uses hyphens; some frontmatter still uses underscores — report, do not silently “fix” in Ubikia alone.
6. **Artwork** for Père Noël was a placeholder; improve when packaging aesthetics matter.

## 3. Deferred packages (resume these later)

Each package is intentionally **small and independent**. Implement only when prioritized.

### P1 — Episode scaffold on main (highest efficiency gain)

**Goal:** version-controlled template so episode N+1 is copy-adapt, not archaeology.

**Suggested layout:**

```text
examples/audible/_template/          # or restore le-pere-noel-revient/
  episode.json                       # slug, source commit, persona, gates
  source.md                          # or pointer + pin metadata only
  spoken.draft.md
  review.template.json
  youtube.metadata.json              # private defaults
  pronunciation-audition.txt
  RUNBOOK.md                         # PowerShell + POSIX
```

**Inputs already known:**

- Working local episode under `artifacts/audible/le-pere-noel-revient/` (if still present).
- Closed issue #17 acceptance criteria and spoken-adaptation rules in `docs/audible-adaptation.md`.
- First episode package patterns under local `artifacts/audible/on-nest-jamais-si-bien-servi/`.

**Do not** commit WAV/MP3/MP4. **Do** pin source commit/blob when copying a real source.

**Done when:** `examples/audible/_template/` (or a concrete reference episode) exists on `main` and is mentioned from `docs/audible.md`.

### P2 — One-page lessons checklist

**Goal:** a single short doc (or section) “two-episode lessons” linking to P1.

**Contents:** Windows node invocation; fallback providers; force-rerender; record→ledger; human YouTube Studio steps; placeholder artwork note.

**Done when:** linked from `docs/audible.md` and `docs/audible-youtube-workflow.md`.

### P3 — Human publication index

**Goal:** generate `publications/index.md` from `publications/ledger/publications.json`.

**Design:** see `research/publication_registry_exploration.md` (ledger-first, Markdown projection).

**Done when:** a table by date/title/platform/URL/source is one click from `publications/README.md`.

### P4 — Registry enrichment (optional)

- `related_work` (issue/PR) on ledger entries  
- multi-platform sibling appearances  
- series/persona views  
- read-only URL liveness check  

Not blocking for the next episode.

### P5 — Media MVP / persona (parallel tracks)

- Issue #2 and M0–M12 — richer media (captions sentence-level, scene cards, …)  
- Issue #16 — persona-aware multichannel  

Node audible path is the **living reference**, not something to re-implement inside Media MVP.

## 4. Cold-start recipe for a future agent

Read in this order:

1. This file  
2. `AGENTS.md`  
3. `docs/audible.md` + `docs/audible-youtube-workflow.md`  
4. `publications/ledger/publications.json`  
5. Only then open issues or `artifacts/`  

Default command posture:

```powershell
cd C:\tweesic\ubikia
npm test
node --env-file=.env cli/audible-render.js --help   # or read cli sources
```

Never auto-publish to YouTube. Never commit `.env` or media binaries.

## 5. Explicit non-goals of this handoff

- Implementing P1–P5 now  
- Merging Media MVP  
- Cloning or committing voices  
- Building a CMS  

## 6. Closing clause

```text
Stable production-shaped audible path: achieved.
Public URLs: memorized in the ledger.
Explorable register: studied, not fully productized.
Episode template and lesson page: deferred packages P1–P2.
```

A future session can start with: *“Implement P1 from `research/audible_stable_baseline_and_continuations.md`.”*
