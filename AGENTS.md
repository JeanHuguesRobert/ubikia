---
document_role: "operational"
document_kind: "agent-mandate"
visibility: "public"
lifecycle_state: "active"
classification_source: "cogentia.js"
classification_version: "1"
classification_rule: "agent-mandate"
classification_confidence: "strong"
---

# AGENTS.md — Ubikia

## Status

This file is the local operational mandate for AI agents working in this repository.

It is not the doctrine itself.  
It is not the corpus itself.  
It is a governed operational projection of the corpus for this repository.

The source methodological reference is:

- [`cogentia/research/agent_configuration_layer.md`](https://github.com/JeanHuguesRobert/cogentia/blob/main/research/agent_configuration_layer.md)

## Repository role

`ubikia` is the repository for governed derivation, publication support, and faithful appearance of a versioned corpus.

Its purpose is to help a source corpus produce multiple situated forms without losing coherence, provenance, or responsibility.

Ubikia is concerned with:

- produits déclinés / derived products;
- source-to-product derivation;
- persona selection;
- audience and platform adaptation;
- publication packages;
- metadata;
- provenance;
- publication ledgers;
- feedback return to corpus;
- reduction of manual publication drift.

Core formula:

```text
Cogentia structures thought.
Ubikia structures appearance.
```

## Core rule

Do not derive without preserving provenance.

A derived product must remain reconstructibly linked to:

- its source corpus;
- source version or commit when available;
- intended form;
- persona;
- audience;
- platform;
- constraints;
- reviewer;
- publication status;
- feedback returned to the corpus.

## What Ubikia is not

Ubikia is not primarily:

- a social media manager;
- a generic content generator;
- a marketing automation tool;
- a CMS in the usual sense;
- an engagement-maximization system;
- an autonomous publisher.

Ubikia must reduce manual repetition without becoming autonomous over the corpus.

## Core distinction

Before editing or creating any document, distinguish clearly between:

- source corpus;
- source document;
- derived product;
- publication package;
- publication record;
- persona;
- platform;
- metadata;
- template;
- schema;
- automation script;
- feedback;
- temporary trace;
- continuation to explore.

Do not present a derived product as the source.  
Do not let platform formatting change doctrine silently.  
Do not treat publication automation as authorship.

## Corpus hierarchy

Use the following hierarchy when stabilizing content:

1. existing source documents in this repository;
2. `cogentia`, when the issue concerns method, corpus, continuations, pipeline, traceability, or agent configuration;
3. the relevant source repository from which a derived product is produced;
4. publication records and ledgers, when reconstructing publication history;
5. conversation material, only as temporary material unless explicitly stabilized;
6. external sources, only when cited, dated, and evaluated.

If a claim is not grounded, mark it as:

```text
to verify
```

or:

```text
hypothesis
```

## Derived product discipline

When creating or modifying a derived product, preserve:

- source reference;
- derivation purpose;
- target audience;
- platform constraints;
- persona constraints;
- status;
- review requirement;
- publication state;
- return-to-corpus notes.

A useful derived product is not merely shorter or more accessible.

It is a situated appearance of the source that does not betray the source.

## Platform discipline

For platform-specific outputs, distinguish:

- GitHub source document;
- Substack essay;
- Medium essay;
- Facebook post;
- LinkedIn post;
- X thread;
- email;
- memo;
- slide deck;
- video script;
- podcast outline;
- conference abstract;
- legal or institutional note.

Never assume that one platform version is automatically suitable for another.

For Facebook outputs, follow the known corpus rule:

```text
No Markdown syntax in Facebook posts.
Plain text only.
Unicode bold may be used sparingly when useful.
```

## Agent permissions

Agents may:

- draft derived products;
- propose publication packages;
- prepare metadata;
- prepare platform-specific formatting;
- propose templates;
- propose schemas;
- prepare publication ledgers;
- identify divergence between source and product;
- mark continuations;
- produce review checklists;
- suggest automation scripts.

Agents must not, without explicit human authorization:

- publish;
- send;
- schedule publication;
- commit consequential doctrine changes;
- treat a draft as reviewed;
- remove provenance;
- invent source references;
- alter a source claim to fit a platform;
- optimize for engagement at the expense of fidelity;
- leak private material from `registre-mariani` or other sensitive sources;
- transform private material into a public product without explicit authorization.

## Confidentiality and private sources

Ubikia may eventually produce derived products from private or sensitive sources.

Default rule:

```text
Private material does not become publishable because it has been processed by Ubikia.
```

If a source comes from `registre-mariani` or another private repository:

- mark the source as private;
- do not copy sensitive content into public files;
- use references, redactions, or synthetic examples when possible;
- require explicit human validation before any public output;
- distinguish current publication from future or posthumous transmission.

## Required checks before stabilization

Before proposing a document as stable, check:

1. Is this a source document, derived product, publication package, schema, template, or ledger entry?
2. Is the source reference explicit?
3. Is the target audience explicit?
4. Is the platform explicit?
5. Is the persona explicit?
6. Are formatting constraints explicit?
7. Is provenance preserved?
8. Is human review required?
9. Is publication status clear?
10. Are feedback and return-to-corpus notes captured?
11. Does this reduce manual drift without increasing doctrinal drift?

## Recommended frontmatter

For derived products, use:

```yaml
---
title:
repository: ubikia
status: draft
version: 0.1
date:
type: derived-product
source_repository:
source_path:
source_commit:
derived_from:
form:
persona:
audience:
platform:
publication_status: draft
review_required: true
reviewer: Jean Hugues Noël Robert
continuations:
---
```

For publication records, use:

```yaml
---
id:
title:
repository: ubikia
type: publication-record
derived_product:
platform:
publication_url:
publication_date:
status:
source_repository:
source_path:
source_commit:
feedback_returned_to_corpus: false
continuations:
---
```

## Minimal completion report

After substantial work, report:

```text
Scope:
Files changed:
Source used:
Derived products prepared:
Publication targets:
Provenance preserved: yes/no
Human validation needed: yes/no
Known risks:
Next step:
```

## Local invariant

Ubikia exists because manual publication is too costly, too repetitive, and too error-prone when a living corpus generates many situated outputs.

But the solution must not become a new capture layer.

```text
Automate appearance.
Do not automate betrayal.
```
