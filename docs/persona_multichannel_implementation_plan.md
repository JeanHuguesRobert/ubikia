# Persona-aware multichannel derivation
## Implementation plan and Ubikial → Ubikia corpus migration

**Status:** planning document, human review required before implementation beyond P0  
**Repository:** `JeanHuguesRobert/ubikia`  
**Related tracker:** to be created  
**Relation to Media MVP:** complements issue #2 and M10; does not replace them

## 1. Problem

Ubikia already preserves provenance, prepares publication packages and records a human-confirmed YouTube publication. The Persona layer, however, is not operational end to end.

The concept exists in the historical repositories `ubikial`, `Ubiks` and `Ubik-jean-hugues`, and in current Ubikia/Cogentia documents:

> A persona is a situated mode of appearance.

A persona allows one living principal to present the same source substance through several legitimate roles, scenes and modes of address without becoming several identities and without allowing the role to capture the source.

The corpus also contains an incomplete naming and architecture migration:

- historical architecture: `Ubikial` was the infrastructure and `Ubikia` its publication agent;
- current architecture: `Ubikia` is the governed derivation infrastructure and includes its publication layer;
- residual references to `Ubikial` and `Ubikia Publisher` remain;
- `cogentia/research/personas.md` is referenced but absent;
- historical repositories are not consistently marked as legacy or superseded;
- some current concept documents still expose duplicated transitional sections.

## 2. Objective

Build a governed derivation pipeline in which every product explicitly resolves:

```text
sovereign source
× form
× persona
× audience
× platform
× purpose
× constraints
→ reviewed derived product
→ publication package
→ human or explicitly authorized publication
→ publication record
→ return to corpus
```

Implementation priority must follow the channels Jean Hugues Noël Robert actually uses, not a generic platform ranking.

## 3. Authority and read order

Before acting, an agent must read:

1. `AGENTS.md` in this repository;
2. `cogentia/AGENTS.md`;
3. `README.md` and `docs/concepts.md` in `ubikia`;
4. `cogentia/research/derived_products.md`;
5. historical documentation and relevant commits in `ubikial`, `Ubiks` and `Ubik-jean-hugues`;
6. the Media MVP documents linked from issue #2;
7. source documents referenced by those materials.

Missing documents and broken references must be reported, not reconstructed silently.

## 4. Doctrinal invariants

### 4.1 One principal

A persona is not a new person, autonomous legal identity, platform account, generic tone preset, deceptive fake identity or independent decision-maker. The principal remains identifiable and responsible for consequential acts.

### 4.2 Situated appearance

A persona may govern point of view, register, explanation depth, vocabulary, signature, examples, relation to the audience and the acts that role may or may not engage.

### 4.3 Source primacy

A persona may select, order, explain, condense or stage source material. It must not silently:

- invent a position;
- increase certainty;
- turn a hypothesis into doctrine;
- turn a personal view into an institutional position;
- create legal, political or financial commitments;
- remove a necessary objection;
- alter facts to improve platform performance.

### 4.4 Persona capture prevention

The system must make visible or reviewable:

- contamination between personas;
- campaign language invading academic work;
- institutional voice claiming unauthorized positions;
- technical voice hiding political or human stakes;
- public-facing voice optimizing engagement at the expense of fidelity.

### 4.5 Orthogonality

Persona, audience, form, platform and account are separate dimensions. Facebook is not a persona. `authorial_public_intellectual` is not a platform.

### 4.6 Publication separation

Generate, validate, export, create a remote draft, schedule and publish are distinct operations. New integrations must not publish publicly by default.

### 4.7 Persona provenance

Every derivation must record source/version, principal, persona/version, form, audience, platform, purpose, constraints, generation method, reviewer, publication decision, result and feedback return.

## 5. Required taxonomy

Do not merge these objects:

```text
Identity / Principal
Persona
Role or office
Audience
Purpose
Form
Platform
Channel account
Credential reference
Derived product
Publication package
Publication record
Feedback record
```

A role such as candidate, association president, author or technical architect is a factual quality. It may inform a persona but is not automatically a persona.

A channel account is a concrete account on a platform. It may have a default persona, but that default must not silently govern every product.

## 6. Target data model

Exact field names may evolve during P0/P3, but the distinctions are mandatory.

### 6.1 `IdentityProfile`

```yaml
id: jean-hugues-noel-robert
canonical_name: Jean Hugues Noël Robert
kind: living_person
authority: self
signatures:
  - Jean Hugues Noël Robert
  - Jean Hugues Noël Robert, baron Mariani
```

### 6.2 `PersonaDefinition`

```yaml
schema: ubikia.persona.v0.1
id: authorial_public_intellectual
version: 1
identity_id: jean-hugues-noel-robert
label: Authorial public intellectual
status: draft
purpose: >
  Make conceptual work publicly legible without reducing it to marketing
  or platform performance.
mandate:
  may:
    - explain
    - contextualize
    - use first person
  must:
    - preserve uncertainty
  must_not:
    - claim institutional authority
    - invent commitments
voice:
  grammatical_person: first
  tone: reflective
  style: explanatory
review:
  required: true
  risk_class: normal_publication
provenance:
  source_references: []
```

The persona model must not be reduced to marketing fields such as `tone`, `style` and `voice`; it needs mandate, prohibitions, authority limits and review policy.

### 6.3 `AudienceDefinition`

Captures assumed context, language, background knowledge, explanation needs and relevant sensitivities.

### 6.4 `PlatformProfile`

Contains only technical/social platform constraints: supported forms, limits, metadata, media, links, accessibility, disclosures and visibility rules. Platform profiles are dated and versioned because rules change.

### 6.5 `ChannelAccount`

Represents a concrete account, its account kind, optional default persona and publication policy. Repository data contains references to secrets, never secret values.

### 6.6 `DerivationRequest`

```yaml
schema: ubikia.derivation-request.v0.1
source:
  repository: JeanHuguesRobert/barons-Mariani
  path: research/example.md
  commit: immutable-source-sha
identity_id: jean-hugues-noel-robert
persona_id: authorial_public_intellectual
audience_id: existing_facebook_network
form: facebook_post
platform_id: facebook
channel_account_id: facebook_personal_jhr
purpose: announce_existing_publication
constraints: []
review:
  required: true
```

### 6.7 `DerivedProductManifest`

Contains the fully resolved context, definition versions, hashes, template/model trace, review status and source-to-product provenance.

## 7. Resolution precedence

A lower layer must never weaken a higher invariant.

Recommended order:

1. mandatory system invariants;
2. confidentiality, rights, safety and consent;
3. source constraints and lifecycle state;
4. principal authority;
5. persona mandate and prohibitions;
6. purpose;
7. audience;
8. form;
9. platform technical constraints;
10. channel-account preferences;
11. request-specific overrides.

Request overrides may replace defaults, never prohibitions. The resolved result must be deterministic, serializable, inspectable and free of secrets.

## 8. Candidate personas: inventory first

The corpus suggests, without yet canonizing:

- `authorial_public_intellectual`;
- `technical_architect`;
- `political_candidate`;
- `institutional_voice`;
- `legal_claimant`;
- `memorial_voice`;
- `agentic_coordinator`.

Each candidate requires corpus research, role/persona distinction, mandate, limits and human validation.

`baron Mariani` requires separate analysis: signature, public quality, editorial brand, persona or combination depending on scene.

## 9. Channel priority

P0 must produce a channel inventory with statuses `confirmed`, `inferred`, `historical` or `unknown`.

Initial hypotheses to verify:

1. Facebook;
2. Substack;
3. Instagram;
4. TikTok;
5. YouTube, already started;
6. other channels only after confirmation.

LinkedIn and X must not become priorities merely because historical prototypes supported them.

## 10. Automation levels

Implement independently for each channel:

```text
L0 — generate local package
L1 — validate package
L2 — open assisted/manual workflow
L3 — create remote draft when officially supported
L4 — schedule with explicit authorization
L5 — publish with explicit per-action authorization
L6 — retrieve result and record remote evidence
```

Each channel may stop permanently at a different level. Official current documentation must be reviewed when remote integration work begins.

## 11. Channel packages

### Facebook

Plain text without Markdown syntax, optional sparing Unicode bold, canonical link, media/preview, alt text when relevant, derivation manifest and publication checklist.

### Substack

Distinguish long article, announcement, short Note and embedded audio/video edition. Package title, subtitle, clean Markdown/HTML body, preview, proposed slug, tags, artwork, alt text, canonical links, disclosures, manifest and checklist.

### Instagram

Distinguish post, carousel, Reel and Story. Package media, caption, alt text, cover, governed hashtags, disclosure, manifest and checklist.

### TikTok

Package vertical video, cover, caption, applicable synthetic-content disclosure, manifest and checklist. Excerpt selection is an editorial act and must preserve interval, omitted-context warning and reviewer, consistently with M12.

### YouTube

Make the existing pipeline consume the shared identity/persona/audience/form/platform/purpose context without breaking `audible:prepare:youtube`, `audible:record:youtube` or current manifests. Provide upward-compatible migration.

## 12. Execution lots

One lot per agent execution. Add tests, run validation, provide the completion report, then stop.

### P0 — Discovery, authority map and ADR

Deliver:

- `docs/persona_multichannel_discovery.md`;
- historical concept/implementation inventory;
- actual channel inventory with confidence status;
- broken and missing reference inventory;
- terminology matrix for identity, role, persona, audience, platform and account;
- ADR proposing repository boundaries and target architecture;
- source citations by path and immutable commit.

Do not implement code or declare personas canonical.

### P1 — Restore canonical Persona doctrine

Recommended source target: `cogentia/research/personas.md`.

Define persona, identity, role, masks/cloaks when relevant, persona capture, disclosure/certification, relation to derived products and agents, ethical limits and responsibility.

This is cross-repository doctrine: use a reviewable issue/PR/patch and require human validation before substantive stabilization.

### P2 — Ubikial → Ubikia migration audit

Produce a machine-readable occurrence table classified as:

- `historical-valid`;
- `rename-required`;
- `conceptual-migration-required`;
- `broken-link`;
- `uncertain`.

Clarify succession, plan legacy markers, propose repair of duplicated Ubikia sections and avoid blind global replacement. Preserve history while removing present ambiguity.

### P3 — Persona and channel schemas

Add versioned schemas for identity, persona, audience, platform, channel account, derivation request and manifest extensions, with valid/invalid examples and compatibility rules.

Required failures:

- persona without principal;
- mandatory prohibition weakened;
- inline secret;
- unknown definition;
- incompatible version;
- role/persona conflation.

### P4 — Registries and governed resolver

Implement file-based registries, deterministic loading, per-leaf provenance, an `explain` report, secret-free serialization and cache keys containing all relevant definition versions.

Test precedence, idempotence, targeted invalidation and non-weakening constraints.

### P5 — Persona-aware derivation context

Separate source facts/claims, persona instructions and platform constraints. Support provider abstraction and deterministic template mode. Record model/template hash, parameters and raw output. Produce source/product diff and drift warnings.

### P6 — Package adapters for active channels

Implement package-only adapters in the order confirmed by P0, one channel per sub-lot. Each adapter must be idempotent, local, secret-free, provenance-preserving and incapable of external publication.

### P7 — Review and cross-channel QC

Add source-fidelity, persona-fit, audience-fit and platform-fit review. Detect unauthorized authority, commitments, increased certainty and removal of central reservations. Produce a variant comparison matrix and reviewed-state transitions.

Deliberate test cases must include campaign/institution confusion, personal opinion presented institutionally, polarizing Facebook drift, deleted caveat and invented technical fact.

### P8 — Unified publication ledger

Generalize the YouTube record to multiple appearances per product. Preserve account, persona, visibility, timestamps, human confirmation, remote verification, correction, withdrawal, replacement, republication and feedback return. Continue reading current YouTube files.

### P9 — Remote connector feasibility and safety

Only after local packages are validated. For each confirmed channel, review current official documentation, permissions, account requirements and limitations. Select a sustainable L0–L6 level, document dry-run and secret references, and create a separate issue before external publication automation.

Do not bypass absent official support through fragile or terms-conflicting automation without explicit human risk acceptance.

### P10 — End-to-end reference case

Use the first published episode as a reference chain. Reconstruct persona/audience/purpose context, preserve existing YouTube provenance, prepare at least two additional local channel packages and document what was human, automated, reviewed and published. Do not republish automatically.

## 13. Media MVP compatibility

- M10 should eventually call shared package adapters instead of duplicating rules.
- M12 supplies reviewed excerpts to Instagram/TikTok/Shorts packages.
- Existing audible workflows must remain usable.
- Existing manifests remain readable; schema evolution is versioned and migrable.

## 14. Transverse tests

At minimum:

1. deterministic resolution;
2. non-weakening invariants;
3. no secrets in output;
4. complete provenance;
5. package idempotence;
6. targeted cache invalidation;
7. YouTube upward compatibility;
8. detectable persona drift;
9. role/persona distinction;
10. package/publication distinction;
11. safe failure for missing definitions;
12. Windows path handling;
13. UTF-8/French character preservation;
14. no generated media binary committed.

## 15. Initial non-goals

- Web dashboard;
- engagement analytics or viral optimization;
- autonomous public publication;
- fictitious account multiplication;
- deceptive impersonation;
- secrets in Git;
- unreviewed global corpus rename;
- finalizing all personas before discovery.

## 16. Global Definition of Done

Complete when:

- canonical Persona doctrine exists and is findable;
- Ubikial → Ubikia succession is explicit without erasing history;
- identity/persona/role/audience/platform/account are separate validated objects;
- resolved derivation requests are inspectable and traceable;
- confirmed active channels have persona-aware local packages;
- variants are comparable and reviewed;
- appearances are recorded in a unified ledger;
- current YouTube workflow still works;
- no new external publication occurs without distinct human authorization.

## 17. Required completion report

```text
Scope:
Files changed:
Repositories touched:
Authority sources used:
Schemas changed:
Commands added or changed:
Tests added:
Tests run:
Provenance preserved: yes/no
External publication performed: yes/no
Known risks:
Reversibility:
Human validation needed:
Next eligible lot:
```

## 18. P0 agent prompt

```text
Repository: JeanHuguesRobert/ubikia
Plan: docs/persona_multichannel_implementation_plan.md

Implement P0 only.

Read AGENTS.md and all authority sources listed in the plan. Produce the discovery document, authority map, channel inventory, broken-reference inventory, terminology matrix and ADR requested by P0.

Do not implement schemas, derivation code, platform adapters, credentials or external publication.
Do not declare candidate personas canonical.
Do not perform a global Ubikial-to-Ubikia replacement.
Cite repository paths and immutable commits for material findings.
Run relevant documentation and link checks.
End with the exact completion report required by the plan, then stop.
```
