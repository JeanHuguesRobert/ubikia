# Layered user configuration

## Purpose

Ubikia is intended for multiple authors, organizations, channels, languages, and publication policies. User-specific instructions must therefore live outside the Ubikia codebase and remain independently versioned.

The recommended default is the GitHub profile repository whose name matches the account:

```text
<account>/<account>
```

For example:

```text
JeanHuguesRobert/JeanHuguesRobert
```

Ubikia looks conceptually for:

```text
.ubikia/profile.json
.ubikia/instructions.md
```

The profile contains structured defaults. The instruction document contains human-readable policy, editorial preferences, review requirements, and publication boundaries.

## Three distinct categories

### 1. Public instructions

Public instructions should normally live in the public account repository. Examples:

- author and series names;
- default language;
- adaptation principles;
- public disclosure wording;
- preferred publication targets;
- review and publication policy;
- public source repositories and canonical links;
- pronunciation guidance that is not sensitive.

Publishing these instructions improves auditability, reuse, correction, and trust. The security of the pipeline must not depend on hiding its rules.

### 2. Private instructions or context

Some users may need a private repository for confidential context or restricted instructions. Examples:

- unpublished manuscripts;
- private biographical context;
- embargoed publication plans;
- confidential pronunciation notes;
- restricted source mappings;
- private reviewer identities or internal workflows.

A private repository protects confidentiality. It must not be used to conceal a weak security design.

The private layer should be selected explicitly by the user or by the Inseme platform configuration. Its existence and repository name do not need to be declared in the public profile.

### 3. Technical secrets

Credentials are not instructions and must not be committed to Git, including private Git repositories.

Examples:

- API keys;
- OAuth refresh tokens;
- passwords;
- signing keys;
- upload credentials;
- cloud storage secrets.

These belong in environment variables, an operating-system credential store, or the future Inseme platform secret service. Versioned configuration may contain only secret references such as:

```json
{
  "apiKeyReference": "env:GRADIUM_API_KEY"
}
```

## Resolution order

A future configuration resolver should apply layers in this order, from lowest to highest precedence:

```text
1. Ubikia defaults
2. public account profile
3. optional private instruction layer
4. local ignored configuration
5. explicit job or CLI overrides
```

Every resolved value should retain provenance:

```json
{
  "value": "fr",
  "source": "JeanHuguesRobert/JeanHuguesRobert:.ubikia/profile.json",
  "commit": "<commit-sha>"
}
```

Higher-precedence layers may override defaults, but must not silently remove mandatory safety or review invariants defined by Ubikia.

## Suggested public account layout

```text
<account>/<account>/
  .ubikia/
    profile.json
    instructions.md
    pronunciation.json
    series/
      <series-id>.json
```

Only `profile.json` and `instructions.md` are part of the initial convention. Other files are future extensions.

## Private layer

A private instruction repository may mirror the same structure:

```text
<private-repository>/
  .ubikia/
    profile.private.json
    instructions.private.md
```

Private files should add or restrict context. They should not duplicate public configuration unnecessarily.

## Public-by-default principle

The recommended posture is:

```text
public when openness improves verification;
private when confidentiality is substantively required;
secret only for credentials and cryptographic material.
```

This is compatible with rejecting security by obscurity. Public algorithms, rules, prompts, schemas, review policies, and operational constraints should remain secure even when fully visible.

## Platform boundary

Ubikia defines schemas, merge semantics, provenance, and required invariants.

The Inseme platform layer will eventually provide:

- authenticated repository access;
- private repository retrieval;
- secret resolution;
- caching and commit pinning;
- policy enforcement;
- job-specific overrides;
- audit logs.

Ubikia must remain usable without Inseme through explicit local files and environment variables.
