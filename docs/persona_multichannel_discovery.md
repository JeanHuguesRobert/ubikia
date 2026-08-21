---
title: Persona-aware Multichannel Discovery
description: P0 discovery, authority map, historical inventory, and repository-boundary ADR for governed multichannel derivation.
author: unknown
affiliation: "Institut Mariani / C.O.R.S.I.C.A., 1 cours Paoli, F-20250 Corte, Corsica"
license: CC BY-SA 4.0
language: en
date: '2026-08-21'
last_modified_at: '2026-08-21'
status: draft
canonical_url: https://github.com/JeanHuguesRobert/ubikia/blob/main/docs/persona_multichannel_discovery.md
document_role: operational
document_kind: discovery-and-adr
document_function: implementation-discovery
target_audience: Ubikia maintainers and future implementation agents
target_scene: technical
lifecycle_state: working
update_policy: UP-DEFAULT-REVIEWED
provenance:
  origin_type: repository
  origin_repository: JeanHuguesRobert/ubikia
  origin_ref: 26b9a5213d96f19ea7f3301d0de5e45f29015818
  origin_date: '2026-08-21'
  derived_from:
    - JeanHuguesRobert/ubikia:docs/persona_multichannel_implementation_plan.md@fad00c1071e2e63db9deed30d1ce7539a8e7950e
    - JeanHuguesRobert/cogentia:research/derived_products.md@7a57e6db1776f1ab01899c70f24dc51d06682b9a
review:
  status: unreviewed
  reviewed_by: []
---

# Persona-aware Multichannel Discovery

## P0 scope and result

This is the P0 deliverable required by
[`persona_multichannel_implementation_plan.md`](https://github.com/JeanHuguesRobert/ubikia/blob/fad00c1071e2e63db9deed30d1ce7539a8e7950e/docs/persona_multichannel_implementation_plan.md).
It records evidence and a proposed architecture; it does not canonize a
persona, create credentials, contact a platform, or change publication state.

The present architecture supports source-first local derivation and a
human-confirmed YouTube record. Instagram is a planned channel, not a
confirmed Ubikia integration. Any earlier “OAuth support” in the historical
Ubikial prototype is demonstrative only: it contains placeholder client IDs
and mocked profile calls.

## Authority map

| Decision or act | Current authority | Evidence / constraint |
| --- | --- | --- |
| Source doctrine and authenticity rule | Cogentia corpus | [`derived_products.md`](https://github.com/JeanHuguesRobert/cogentia/blob/7a57e6db1776f1ab01899c70f24dc51d06682b9a/research/derived_products.md) keeps source primacy, provenance, contextual transparency, and responsible publication distinct. [`ia_pour_tous_ia_pour_chacun.md`](https://github.com/JeanHuguesRobert/cogentia/blob/a360eeb286630f44caa640fd31309298d1b0173a/research/ia_pour_tous_ia_pour_chacun.md) adds public-presence capacity and freedom of expression as the governing objective. |
| Local derivation and publication packages | Ubikia | [`AGENTS.md`](https://github.com/JeanHuguesRobert/ubikia/blob/26b9a5213d96f19ea7f3301d0de5e45f29015818/AGENTS.md) permits preparation, not external publication without explicit authorization. |
| Human review and a consequential publication decision | Principal / responsible publisher | A technical account grant does not replace editorial responsibility. |
| Account connection and remote API act | Account holder under an explicit, scoped mandate | Not performed in P0. Credentials are not corpus data. |
| Durable connector jobs, secret references, and remote-state handling | A later operational boundary | Not yet allocated or implemented by this P0 decision. |

The governing separation is therefore:

```text
source authority != persona != channel account != credential != publication decision
```

## Historical and current inventory

| Location | Finding | Confidence | Consequence |
| --- | --- | --- | --- |
| [`archive-Ubikial`](../../archive-Ubikial) at `f7917fecf36d1984a8ebdf42b7fde075de967f6a` | React prototype with Twitter, LinkedIn, Facebook, and Instagram account UI, OAuth configuration, and platform previews. | historical | Preserve as evidence of earlier intent; do not reuse its OAuth code as an integration. |
| [`OAuthManager.ts`](https://github.com/JeanHuguesRobert/Ubiks/blob/f7917fecf36d1984a8ebdf42b7fde075de967f6a/src/services/oauth/OAuthManager.ts) | Instagram uses `instagram-client-id`; scopes and endpoints are historical assumptions. | historical | Placeholder configuration is not a credential, permission grant, or current API design. |
| [`OAuthCallback.tsx`](https://github.com/JeanHuguesRobert/Ubiks/blob/f7917fecf36d1984a8ebdf42b7fde075de967f6a/src/pages/OAuthCallback.tsx) | Facebook and Instagram profile functions are explicitly mocked. | historical | No account connection or platform verification can be inferred. |
| `archive-Ubiks` | Local archive exists but is not a Git checkout in this workspace. | unknown | It cannot provide an immutable commit citation in P0; inspect separately before treating it as authority. |
| `Ubik-jean-hugues` | No directory with this name was found in the current workspace. | unknown | Reported missing; do not reconstruct its history. |
| [`src/audible`](https://github.com/JeanHuguesRobert/ubikia/tree/26b9a5213d96f19ea7f3301d0de5e45f29015818/src/audible) | Local YouTube package and human-confirmed publication-record workflow exist. | confirmed | Preserve upward compatibility in later persona work. |
| [`src/substack-publisher.js`](https://github.com/JeanHuguesRobert/ubikia/blob/26b9a5213d96f19ea7f3301d0de5e45f29015818/src/substack-publisher.js) | A Substack draft helper exists and defaults to creating a remote draft when invoked with a session cookie. | inferred | It is code capability, not evidence of a configured publication or an authorization to invoke it. |
| [`media_agent_runbook.md`](https://github.com/JeanHuguesRobert/ubikia/blob/fad00c1071e2e63db9deed30d1ce7539a8e7950e/docs/media_agent_runbook.md) | M0–M11 may not upload to any platform; `ready_for_manual_publication` is their maximum output. | confirmed | This remains the active media-work boundary pending a separately authorized connector design. |

## Actual channel inventory

The statuses describe evidence in the corpus and workspace, not the existence
of a personal account. No external account was inspected.

| Channel | Status | Evidence | Current safe level |
| --- | --- | --- | --- |
| YouTube | confirmed | Local package, validation, and human-confirmed record workflow. | L0–L1 locally; recorded publication only after human confirmation. |
| Substack | inferred | Draft-oriented helper and adapter registry exist. | L0–L1 by default; any remote draft needs a separate mandate. |
| Facebook | historical | Historical prototype and current package conventions, but no active connector evidence. | L0–L1 package only. |
| Instagram | unknown | Historical mock flow; current media pipeline names `instagram_reel_future`, but there is no adapter, account evidence, or current official integration. | L0–L1 package only, after a future implementation lot. |
| TikTok | unknown | Planning target only. | L0–L1 package only, after a future implementation lot. |
| LinkedIn and X | historical | Historical prototype support. | Not prioritized without current-channel confirmation. |

### Current priority

The principal has identified organic Instagram publication as a near-term need
for the 2026 Haute-Corse senatorial campaign (2026-08-21). This changes the
execution order, not the evidence status above: Instagram remains `unknown`
as a configured account/API capability, but becomes the first channel for a
scoped L0–L2 campaign package workflow. The first fast path is manual
publication from a reviewed local package; it does not wait for API work.

The Instagram conclusion is deliberately narrow: the platform is possible,
not currently integrated. Meta’s current documentation says the Instagram API
serves professional accounts (Business and Creator); with Facebook Login,
content publishing is available to professional accounts, while Stories are
limited to Business accounts. This is a current external dependency to
re-check when a connector lot begins, not a P0 authorization to connect an
account. See [Meta’s Instagram API collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api?entity=request-23987686-894be833-d0b6-4877-859e-c61ae6474d64).

## Broken or missing references

| Reference | State | Handling |
| --- | --- | --- |
| `cogentia/research/personas.md` | missing from the current Cogentia checkout | Keep the missing-reference report; P1 is the proposed doctrine-restoration lot. |
| `Ubik-jean-hugues` historical repository | not found in this workspace | Do not infer its content or status. Locate an authoritative checkout or immutable remote reference first. |
| `archive-Ubiks` immutable repository history | unavailable locally | Treat its material as unverified historical context until an immutable source is supplied. |
| “Ubikial” / “Ubikia Publisher” terminology | transitional references remain | P2 must classify each occurrence before any rename; no blind replacement. |

## Terminology matrix

| Term | Meaning | Must not be conflated with |
| --- | --- | --- |
| Principal / identity | The human or legal person responsible for consequential acts. | Persona, account, agent, credential. |
| Role or office | A factual capacity, such as author or association president. | A persona or an automatically granted mandate. |
| Persona | A bounded mode of appearance for a source, audience, and purpose. | A second person, platform, or tone preset. |
| Audience | Intended receiver and foreseeable interpretive context. | Platform or account. |
| Form | Editorial shape, such as essay, carousel, Reel, or Story. | Platform. |
| Platform | Technical and social publication scene, such as Instagram. | Persona or channel account. |
| Channel account | A specific profile/page controlled on a platform. | Principal, credential, or universal publication authorization. |
| Credential reference | A pointer to a protected secret or delegated access capability. | Corpus provenance or publication approval. |
| Publication package | Local, reviewable files prepared for a platform. | A remote draft or publication record. |
| Publication record | Evidence of an external appearance and its result. | A package or a permission to publish. |

## ADR-001: Keep doctrine, packages, and connectors separate

**Status:** proposed; requires human review before implementation beyond P0.

### Context

The corpus needs multichannel reuse without letting platform mechanics,
credentials, or engagement optimisation capture source material. The existing
media pipeline is intentionally package-first and manual-publication-first.
Instagram adds evolving vendor constraints and a distinction between post,
carousel, Reel, and Story.

### Decision

Use these boundaries:

```text
Cogentia  -> doctrine, source versions, provenance and mandates
Ubikia    -> derivation, reviewable packages, local validation and ledgers
connector -> optional remote capability: credentials, API calls, retry and evidence retrieval
principal -> mandate, editorial review and consequential publication decision
```

The connector may later live in an operational service, but it must not become
the source of doctrine or silently turn a package into a publication. Secrets
remain in a protected runtime/vault; the corpus stores only a non-secret
reference and governed evidence of the resulting act.

### Public-presence constraint

The purpose of a persona-aware publication workflow is to make public
expression practicable for its principal, not to turn that principal into a
brand or to govern their opinions. The workflow may assist an explicit
editorial objective -- for example, explaining a position, making sources
accessible, or inviting a reasoned public response -- but it must not infer or
impose an ideological objective.

Accordingly, an implementation must:

- preserve the principal's freedom to express lawful disagreement, including
  forms or subjects that do not maximise audience growth;
- distinguish a visible persona from a fictitious additional person or a
  fabricated appearance of support;
- make any proposed distribution or formatting objective explicit and
  reviewable, rather than silently optimising outrage, antagonism, dependency,
  or compulsive attention;
- prepare accessible, sourced, and context-aware appearances without treating
  reputation, follower count, or engagement as a measure of a person's value;
- permit plural publication styles and selected bridges between communities,
  without algorithmically enclosing a principal in a homogeneous audience.

These are constraints on Ubikia's means, not an editorial police. Ubikia does
not judge opinions or suppress lawful expression. It preserves the distinction
between an explicit principal mandate, a reviewable package, and an externally
engaging publication decision.

For every channel, preserve the following independently selectable levels:

```text
L0 local package -> L1 validation -> L2 assisted workflow -> L3 remote draft
-> L4 scheduled act -> L5 public publish -> L6 remote evidence and record
```

P0 changes none of these levels. The default is L0–L1. A broad user mandate
may reduce repeated low-risk prompts, but it must define its scope, duration,
channels, accounts, content classes, spending limits, and escalation
conditions; it cannot erase editorial responsibility or transparency checks.

### Consequences

- Instagram can be implemented largely through repeatable local packaging and
  a later connector, but account conversion, consent, permission review, and
  high-consequence publication remain human-governed boundaries.
- Business is a platform account category, not a claim that the principal is a
  legal corporation. It is a reasonable account choice when Stories through
  the current Meta API are required.
- The authenticity record added to the media pipeline is reused by future
  Instagram packages. Disclosure remains contextual: it prevents a material
  false appearance to the reasonably foreseeable audience, rather than
  labelling every AI-assisted act indiscriminately.
- A future implementation lot must read current official Meta documentation,
  declare the desired media forms, and test locally before any consent or
  remote act.

### Alternatives rejected for now

- **Revive Ubikial OAuth code:** rejected because it is mock/placeholder code,
  uses obsolete assumptions, and mixes browser storage with credential logic.
- **Make Instagram a direct publication target now:** rejected because no
  account, authorization, connector, or remote-state evidence is present.
- **Treat all AI assistance as requiring the same public label:** rejected
  because the governing rule is material audience deception risk, with
  provenance and contextual disclosure retained for review.

## P0 completion report

```text
Scope: Discovery, authority map, historical inventory, channel inventory, terminology matrix, and ADR only.
Files changed: docs/persona_multichannel_discovery.md.
Source used: Ubikia instructions and plan; Cogentia derived-products doctrine; historical Ubikial code; current Ubikia media and publication code.
Derived products prepared: This discovery/ADR document only.
Publication targets: None. No external account, credential, draft, schedule, or publication was touched.
Provenance preserved: yes.
Known risks: Historical repository evidence is incomplete; Meta requirements are vendor-controlled and must be refreshed before connector work.
Reversibility: Full; this is a local documentation addition.
Next step: Prepare or review the first Instagram campaign package for manual publication; in parallel, review ADR-001 before any account connector work.
Human validation needed: yes.
```
