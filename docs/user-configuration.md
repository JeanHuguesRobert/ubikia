# Layered user configuration

## Purpose

Ubikia is intended for multiple authors, organizations, languages, channels, and publication policies. User-specific instructions therefore live outside the Ubikia codebase and remain independently versioned.

The recommended public source is the GitHub profile repository whose name matches the account:

```text
<account>/<account>/
  .ubikia/
    profile.json
    instructions.md
```

For example:

```text
JeanHuguesRobert/JeanHuguesRobert/.ubikia/profile.json
```

`profile.json` contains structured defaults. `instructions.md` contains human-readable policy, editorial preferences, review requirements, and publication boundaries.

## Three categories

### Public instructions

Public instructions should normally live in the public account repository. Examples include:

- author, persona, and series names;
- default language;
- adaptation principles;
- disclosure wording;
- publication targets;
- review and publication policy;
- canonical links;
- non-sensitive pronunciation guidance.

Publishing these instructions improves auditability, reuse, correction, and trust. Pipeline security must not depend on hiding its rules.

### Private instructions or context

A private repository may contain confidential context or restricted instructions, such as:

- unpublished manuscripts;
- private biographical context;
- embargoed plans;
- restricted source mappings;
- private reviewer identities.

A private repository protects confidentiality. It must not conceal a weak security design. The layer is selected explicitly by the user or by Inseme.

### Technical secrets

Credentials are not instructions and must not be committed to Git, including private repositories.

This includes API keys, OAuth tokens, passwords, signing keys, upload credentials, and cloud secrets. Versioned configuration contains references only:

```json
{
  "secretReferences": {
    "gradiumApiKey": "env:GRADIUM_API_KEY"
  }
}
```

The resolver reports whether an environment reference is available. It never copies the secret value into resolved JSON.

## Resolution order

Layers are applied from lowest to highest precedence:

```text
1. Ubikia defaults
2. public account profile
3. optional private profile
4. optional local ignored profile
5. optional job or CLI overrides
```

Objects are merged recursively. Arrays and scalar values are replaced by the higher-precedence layer. `null` is an explicit value, not a deletion instruction.

Every resolved leaf retains provenance:

```json
{
  "defaultLanguage": {
    "layer": "public-profile",
    "source": "JeanHuguesRobert/JeanHuguesRobert:.ubikia/profile.json",
    "commit": "<commit-sha>",
    "sha256": "<profile-file-sha256>"
  }
}
```

When the CLI reads local files directly, `source` is the absolute filename and `commit` is `null`. The file SHA-256 is still recorded. A future authenticated loader can pass repository paths and pinned commits to the same merge engine.

## Mandatory invariants

Higher-precedence layers cannot silently weaken these initial invariants:

```text
publicationPolicy.humanReviewRequired = true
publicationPolicy.automaticPublicPublicationAllowed = false
```

An attempted override fails with `ConfigurationInvariantError`.

These invariants apply across derived-product types, not only audio.

## Local CLI

From the Ubikia repository root:

```powershell
npm run config:resolve -- `
  <public-profile> `
  <output> `
  [private-profile] `
  [local-profile] `
  [job-overrides]
```

For a sibling checkout of a profile repository:

```powershell
npm run config:resolve -- `
  ..\JeanHuguesRobert\.ubikia\profile.json `
  artifacts\config\JeanHuguesRobert.resolved.json
```

With all optional layers:

```powershell
npm run config:resolve -- `
  ..\ExampleUser\.ubikia\profile.json `
  artifacts\config\ExampleUser.resolved.json `
  ..\private-context\.ubikia\profile.private.json `
  .ubikia\profile.local.json `
  jobs\current-job.json
```

Use `-` as the output filename to write JSON to standard output.

## Resolved output

The generated object contains:

```text
schema
resolved_at
config
provenance
layers
invariants
secret_references
instructions
```

Instruction documents are loaded and hashed at runtime, but their contents are omitted from serialized output by default. This prevents a private instruction document from being copied accidentally into an artifact.

To include instruction text in a deliberately protected local output:

```powershell
$env:UBIKIA_INCLUDE_INSTRUCTION_CONTENT = "true"
npm run config:resolve -- <public-profile> <output>
```

The output must then be treated according to its most restrictive layer.

## Secret-reference status

The resolver recognizes:

```text
env:NAME
secret:identifier
credential:identifier
```

It reports one of:

```text
available
missing
external_resolver_required
```

The actual secret value is never serialized. `secret:` and `credential:` references require an external resolver supplied by Inseme or another platform.

## Instruction paths

Paths listed in `instructionFiles` are resolved from the root of the repository containing the profile:

```json
{
  "instructionFiles": [
    ".ubikia/instructions.md"
  ]
}
```

When `instructionFiles` is absent, the resolver looks for `instructions.md` beside the profile file.

A declared instruction file that does not exist is an error. Missing policy must not disappear silently.

## Suggested account layout

```text
.ubikia/
  profile.json
  instructions.md
  pronunciation.json
  personas/
  series/
  products/
```

Product-specific files should specialize generic account policy rather than duplicate it. The same resolver can support audible essays, social posts, technical briefs, political notes, video scripts, publication packages, and other derived products.

## Public-by-default principle

```text
public when openness improves verification;
private when confidentiality is substantively required;
secret only for credentials and cryptographic material.
```

Public algorithms, prompts, schemas, review policies, and operational constraints should remain secure when fully visible.

## Platform boundary

Ubikia provides:

- deterministic layer merging;
- per-field provenance and source hashes;
- instruction-document loading and hashing;
- secret-reference inspection without disclosure;
- mandatory invariant enforcement;
- a local CLI and machine-readable output.

Inseme will eventually provide:

- authenticated repository access;
- private-repository retrieval;
- commit pinning and caching;
- external secret resolution;
- policy enforcement across jobs;
- durable audit logs;
- job-specific configuration delivery.

Ubikia remains usable without Inseme through explicit local files and environment references.
