---
title: Instagram Publication Package
document_role: operational
document_kind: package-schema
visibility: public
lifecycle_state: working
update_policy: UP-DEFAULT-REVIEWED
language: en
---

# Instagram publication package

`npm run package:instagram` creates a local JSON package for a reviewed manual
Instagram publication. It has no Meta credential, network operation,
scheduling, or publication capability.

```text
source + reviewed draft + resolved configuration
  -> local Instagram package
  -> human editorial and account-context review
  -> manual publication by the responsible person
  -> later human-confirmed ledger record
```

## CLI

```powershell
npm run package:instagram -- `
  artifacts\instagram\draft.json `
  artifacts\config\JeanHuguesRobert.resolved.json `
  artifacts\instagram\ig_20260821_01.package.json
```

The draft requires a stable `id`, `form`, `principal`, caption, media with
`alt_text`, immutable source provenance, and a `public_presence` declaration.
Supported local forms are `single_image`, `carousel`, `reel`, and `story`.
This is a package vocabulary, not a claim of current remote API support.

## Public-presence declaration

```json
{
  "public_presence": {
    "editorial_objectives": ["Explain a sourced public position"],
    "distribution_strategy": "principal_selected",
    "fabricated_support": false,
    "autonomous_engagement_optimization": false,
    "opinion_normalization": false
  }
}
```

The validator checks declared means only. It does not assess the merit or
legitimacy of an opinion. `principal_selected` means the principal explicitly
chose the desired distribution objective; it is not an authorization for a
platform action.

## Boundaries

Every output remains `draft`, has `manual_publication_required: true`, and
records `remote_api_call_performed: false`. Account connection, remote draft,
scheduled publication, public publication, interaction, and paid distribution
remain separate governed acts.
