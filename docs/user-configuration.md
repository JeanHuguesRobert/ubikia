# Layered user configuration

## Purpose

Ubikia is intended for multiple authors, organizations, channels, languages, and publication policies. User-specific instructions therefore live outside the Ubikia codebase and remain independently versioned.

The recommended public source is the GitHub profile repository whose name matches the account:

```text
<account>/<account>
```

For example:

```text
JeanHuguesRobert/JeanHuguesRobert
```

The initial convention is:

```text
<account>/<account>/
  .ubikia/
    profile.json
    instructions.md
```

`profile.json` contains structured defaults. `instructions.md` contains human-readable policy, editorial preferences, review requirements, and publication boundaries.

## Three distinct categories

### Public instructions

Public instructions should normally live in the public account repository. Examples include:

- author and series names;
- default language;
- adaptation principles;
- public disclosure wording;
- preferred publication targets;
- review and publication policy;
- public source repositories and canonical links;
- pronunciation guidance that is not sensitive.

Publishing these instructions improves auditability, reuse, correction, and trust. Pipeline security must not depend on hiding its rules.

### Private instructions or context

Some users may need a private repository for confidential context or restricted instructions. Examples include:

- unpublished manuscripts;
- private biographical context;
- embargoed publication plans;
- confidential pronunciation notes;
- restricted source mappings;
- private reviewer identities or internal workflows.

A private repository protects confidentiality. It must not be used to conceal a weak security design. The private layer is selected explicitly by the user or by the Inseme platform configuration.

### Technical secrets

Credentials are not instructions and must not be committed to Git, including private repositories.

Examples include:

- API keys;
- OAuth refresh tokens;
- passwords;
- signing keys;
- upload credentials;
- cloud storage secrets.

These belong in environment variables, an operating-system credential store, or the future Inseme platform secret service. Versioned configuration contains references only:

```json
{
  "secretReferences": {
    "gradiumApiKey": "env:GRADIUM_API_KEY"
  }
}
```

The resolver reports whether an environment reference is available, but never reads its value into the resolved JSON.

## Implemented resolution order

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
    "commit": "<commit-sha>"
  }
}
```

When the CLI reads local files directly, `source` defaults to the absolute filename and `commit` is `null`. A future authenticated platform loader can pass repository paths and pinned commit identifiers to the same merge engine.

## Mandatory invariants

Higher-precedence layers may specialize configuration, but they cannot silently weaken these initial invariants:

```text
publicationPolicy.humanReviewRequired = true
publicationPolicy.automaticPublicPublicationAllowed = false
```

An attempted override fails resolution with a `ConfigurationInvariantError`.

These invariants apply across derived-product types, not only audio.

## Local file-based CLI

From the Ubikia repository root:

```powershell
npm run config:resolve -- `
  <public-profile> `
  <output> `
  [private-profile] `
  [local-profile] `
  [job-overrides]
```

For a sibling checkout of a GitHub profile repository:

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

Use `-` as the output filename to write the resolved JSON to standard output.

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

Instruction documents are loaded and hashed at runtime, but their contents are omitted from serialized output by default. This avoids accidentally copying private instructions into an artifact.

To include instruction text in a deliberately protected local output:

```powershell
$env:UBIKIA_INCLUDE_INSTRUCTION_CONTENT = "true"
npm run config:resolve -- <public-profile> <output>
```

The output must then be treated according to the most restrictive instruction layer it contains.

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
a missing
external_resolver_required
```

The actual secret value is never serialized. `secret:` and `credential:` references require a future external resolver supplied by Inseme or another platform.

## Instruction-file paths

Paths listed in `instructionFiles` are resolved from the root of the repository containing the profile. Therefore this public profile is valid:

```json
{
  "instructionFiles": [
    ".ubikia/instructions.md"
  ]
}
```

When `instructionFiles` is absent, the resolver looks for `instructions.md` beside the profile file.

A declared instruction file that does not exist is an error. Missing instructions must not disappear silently.

## Suggested extensions

The account repository may later contain:

```text
.ubikia/
  profile.json
  instructions.md
  pronunciation.json
  personas/
  series/
  products/
```

Product-specific files should specialize generic account policy rather than duplicate it. The same resolver can support audible essays, social posts, technical briefs, video scripts, publication packages, and other derived products.

## Public-by-default principle

The recommended posture is:

```text
public when openness improves verification;
private when confidentiality is substantively required;
secret only for credentials and cryptographic material.
```

This is compatible with rejecting security by obscurity. Public algorithms, prompts, schemas, review policies, and operational constraints should remain secure even when fully visible.

## Platform boundary

Ubikia now provides:

- deterministic layer merging;
- per-field provenance;
- instruction-document loading and hashing;
- secret-reference inspection without secret disclosure;
- mandatory invariant enforcement;
- a local CLI and machine-readable output.

The Inseme platform layer will eventually provide:

- authenticated repository access;
- private-repository retrieval;
- commit pinning and caching;
- external secret resolution;
- policy enforcement across jobs;
- durable audit logs;
- job-specific configuration delivery.

Ubikia remains usable without Inseme through explicit local files and environment references.
