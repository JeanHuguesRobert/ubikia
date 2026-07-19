---
title: "Publication registry exploration"
document_role: "source"
document_kind: "research-note"
visibility: "public"
lifecycle_state: "working"
status: "exploration"
date: "2026-07-19"
author: "Jean Hugues Noël Robert"
repository: "ubikia"
related_documents:
  - "ubikia/docs/publication_layer.md"
  - "ubikia/docs/concepts.md"
  - "ubikia/publications/README.md"
  - "ubikia/publications/ledger/publications.json"
continuations:
  - "human-readable publication index"
  - "multi-platform registry views"
  - "optional GitHub issue/project sync"
  - "return-to-corpus from appearances"
---

# Publication registry exploration

## Question

Ubikia already produces publications and keeps fragments of their history in several places (Git, local artifacts, platforms). What is still missing for a **practical, explorable publication register** — something a human or agent can open and answer quickly:

```text
What have we published?
Where does it live?
From which source?
Under which persona / form / platform?
What can still be recovered if a disk dies?
```

This note is an exploration, not a finished design.

## Diagnosis: information is present, exploration is not

Today the knowledge is **dispersed** across layers that each answer only part of the question.

### 1. GitHub (planning and code memory)

Useful for:

- issues and PRs that *authorized* or *implemented* a publication path;
- commit history of derivation tooling;
- comments that record decisions and URLs after the fact;
- draft vs merged state of work.

Not practical as a register because:

- issues are event streams, not a catalog of appearances;
- closing an issue does not yield a browsable list of public URLs;
- PR descriptions and comments bury the durable fact (“this video is public here”);
- searching GitHub for “youtu.be” is possible but noisy and incomplete.

**GitHub is a good audit trail of *work*. It is a poor catalog of *appearances*.**

### 2. Local artifacts (`artifacts/`, gitignored)

Useful for:

- regenerating packages;
- hashes, segments, reviewed speech, package JSON;
- operational resume of a render job.

Not practical as a register because:

- not versioned with the corpus by default;
- machine-local; not shared with collaborators or future machines;
- too heavy (media binaries) and too volatile.

**Artifacts are workshops, not the public inventory.**

### 3. Versioned ledger (`publications/ledger/publications.json`)

Useful for:

- durable, secret-free URL memory in the repository;
- machine-readable upsert from `audible:record:youtube`;
- explicit link between slug, source, platform id, and human confirmation.

Not yet practical for daily exploration because:

- raw JSON is correct but not a pleasant index for humans;
- no generated table / HTML / README catalog by default;
- multi-platform and multi-series views are not defined;
- no query surface (by persona, source repo, year, platform);
- no automatic cross-check against GitHub issues or platform APIs.

**The ledger is the seed of a register, not yet the register as a product.**

### 4. Platforms (YouTube, Substack, …)

Useful for:

- public appearance and audience scene;
- **recoverability backup**: re-download, re-link, comments, title/description history;
- social proof that something actually appeared.

Not sufficient alone because:

- not under corpus governance;
- platform metadata can drift from source claims;
- account loss, policy changes, or delisting break the chain;
- multi-platform appearances of one source are hard to reconstruct from one platform.

**Platforms back up *files and scenes*, not *responsibility*.**

## Desired object: a publication register

A **register** (registre des publications) should be:

```text
explorable by humans
queryable by agents
versioned with the corpus
thin enough to commit
rich enough to reconstruct provenance
honest about recovery paths (ledger + platform + local workshop)
```

It is not:

- a CMS;
- an automatic publisher;
- a replacement for platform UIs;
- a dump of media binaries into Git.

## Minimal information model (candidate)

Each register entry should answer at least:

| Field | Role |
|-------|------|
| `id` | Stable registry id (`youtube:BklzkGmP0HI`) |
| `title` | Public title |
| `platform` | Scene of appearance |
| `url` / `canonical_url` | Recoverable public locator |
| `status` / `visibility` | Publication state |
| `published_at` | When it appeared |
| `source` | Repository, path, commit when known |
| `product` | Form, kind, persona, series |
| `evidence` | Human confirmation vs remote verification |
| `platform_as_backup` | Explicit recoverability claim |
| `local_artifact_directory` | Optional workshop path (non-authoritative) |
| `related_work` | Optional issue/PR/commit links (GitHub as audit, not catalog) |
| `continuations` | Open questions after appearance |

Current ledger entries already cover most of this for YouTube. Gaps: human index, multi-platform, series views, related GitHub work links, feedback-return flags.

## Design options (to evaluate later)

### Option A — Ledger-first + generated views (recommended direction)

Keep `publications/ledger/publications.json` as the write-ahead machine memory.

Add thin generated projections committed or generated on demand:

```text
publications/index.md          # human table by date
publications/by-platform/*.md  # optional
publications/by-series/*.md    # optional
```

Pros: fits file-based corpus; easy PR review; agents can parse JSON; humans browse Markdown.  
Cons: need a small generator script and discipline after each record.

### Option B — One Markdown register hand-edited

A single curated `publications/REGISTER.md`.

Pros: maximal human control.  
Cons: drifts from machine records; bad for agents; duplicates ledger.

### Option C — GitHub Project / Issues as register

One issue per publication or a Project board.

Pros: notifications, UI, assignees.  
Cons: issues are workflows, not stable catalogs; export friction; couples appearance memory to GitHub product features.

### Option D — External database / Inseme service

Pros: query power, multi-user.  
Cons: premature for current volume; against “files first until workflow is stable”.

**Working hypothesis:** A first, then maybe selective C links for work tracking — not C as sole catalog.

## Role of GitHub in the register

GitHub should remain the place for:

- authorizing work (issues);
- reviewing code and packages (PRs);
- optional backlinks from a register entry (`related_work: [#17, #20]`).

GitHub should not become:

- the only list of public URLs;
- the only place an agent looks to rebuild publication history.

Suggested relation:

```text
GitHub issue/PR  =  how we decided and built
Register entry   =  what appeared where
Platform URL     =  recoverable public scene
Local artifacts  =  how to rebuild the package
```

## Platform-as-backup principle

Retain explicitly in the register:

```text
platform_as_backup: true
```

Meaning:

1. The corpus does not depend on the platform for *truth*.
2. The corpus may depend on the platform for *recovering a published binary or page* when local media are gone.
3. The register must store enough locator data (URL, platform id, title, date) to find the appearance again.
4. Periodic human or agent checks may later verify that URLs still resolve (optional continuation; never silent re-publish).

## Immediate state (2026-07-19)

Known public YouTube appearances already seeded in the ledger:

| Date | Title | URL |
|------|-------|-----|
| 2026-07-14 | On n’est jamais si bien servi… | https://youtu.be/mjdHmPvNmB0 |
| 2026-07-19 | Le Père Noël revient… | https://youtu.be/BklzkGmP0HI |

This is enough volume to design exploration views without waiting for a database.

## Continuations

1. **Human index** — generate `publications/index.md` from the ledger (table: date, title, platform, URL, source, persona).
2. **related_work fields** — optional issue/PR/commit links on each entry.
3. **Multi-platform** — same source, several appearances (YouTube + Substack + Facebook) as sibling entries or a parent “appearance set”.
4. **Series / persona views** — e.g. “Les carnets du baron Mariani — édition audio”.
5. **URL liveness check** — read-only probe; record last_checked; never auto-publish.
6. **Return-to-corpus** — flag feedback harvested from platform scenes.
7. **Inseme later** — only if multi-author / multi-machine query demand exceeds files.

## Non-goals for this exploration

- automatic public publication;
- storing media binaries in Git;
- replacing YouTube Studio or Substack dashboards;
- full CMS search.

## Provisional conclusion

A good part of the necessary *information* already exists in GitHub work traces, local packages, platform pages, and the new JSON ledger.  
What is missing is a **practical exploration surface**: a register that is easy to open, easy to scan, easy for agents to query, and explicit about recovery paths.

Next smallest useful step, when prioritized:

```text
ledger (source of truth for URLs)
  → generated publications/index.md (human scan)
  → optional related_work backlinks to GitHub
```

Until then, treat this document as the continuation clause for “registre des publications explorables”.
