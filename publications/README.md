# Publication memory

This directory holds **version-controlled publication memory** for Ubikia.

## Why it exists

Local rendering still produces rich artifacts under `artifacts/` (gitignored):

```text
spoken scripts, segments, masters, MP4 packages, publication.youtube.json
```

Those files are operational working copies. They must not be the only place where public URLs live.

The **publication ledger** records durable appearances:

```text
source / derived product
  → reviewed package
  → human publication on a platform
  → ledger entry with URL
```

## Platform as backup

Publication platforms are not the source of truth for doctrine.  
They do, however, act as a practical **recoverability backup**:

- a public YouTube video can usually be re-downloaded or re-linked;
- metadata and comments may preserve context that local disks lose;
- the ledger stores the stable URL so the corpus can find the appearance again.

Ubikia therefore keeps:

1. **source and derived product** in the corpus repositories;
2. **URL ledger entries** here (inspectable, diffable, no secrets);
3. **local media artifacts** on disk when regenerating or packaging;
4. **platform copies** as recoverable appearances, not masters of meaning.

## Files

| Path | Role |
|------|------|
| `ledger/publications.json` | Machine-readable ledger of known public appearances |
| `README.md` | This note |

## Updating the ledger

After a human confirms a YouTube upload:

```powershell
node --env-file=.env cli/audible-record-youtube.js `
  artifacts/audible/<slug> `
  https://youtu.be/<VIDEO_ID> `
  public `
  "Jean Hugues Noël Robert"
```

The command still writes the local `publication.youtube.json` under `artifacts/`, and **also upserts** the versioned ledger entry.

## Continuations

- richer multi-platform ledger fields (Substack, Medium, X, …);
- automatic reconciliation against platform APIs (optional, never silent public publish);
- return-to-corpus feedback links from each appearance;
- optional signed export of ledger + source commits for archival packages.
