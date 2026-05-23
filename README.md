# Ubikia
## Derive without betraying

**Status:** README draft v0.2  
**Repository:** `JeanHuguesRobert/ubikia`  
**Related corpus:** Cogentia / Cogentia Commons  
**Date:** 2026-05-23  

---

## 1. What Ubikia Is

Ubikia is an editorial derivation infrastructure for versioned corpora.

It helps a source corpus appear in multiple situated forms without losing coherence, provenance, or responsibility.

Ubikia starts from a simple principle:

> Do not popularize from the academic paper. Derive from the corpus.

A versioned source corpus may give rise to many derived products:

- academic papers;
- public essays;
- blog essays;
- technical briefs;
- political notes;
- legal arguments;
- conference abstracts;
- social media posts;
- video scripts;
- podcast outlines;
- continuation prompts;
- agent memory packets.

Each derived product is a situated form of the source.

The source carries the substance.  
The derived product organizes the form.  
The platform provides the scene of appearance.  
The persona governs the mode of address.  
The publication layer manages distribution and traceability.

---

## 2. Relation to Cogentia

Ubikia is designed as the publication and derivation counterpart of Cogentia.

```text
Cogentia
  = coherence, cognition, corpus, signatures, continuations

Ubikia
  = derivation, publication, appearances, provenance
```

A shorter formula:

> Cogentia structures thought.  
> Ubikia structures appearance.

Cogentia helps preserve cognitive coherence.  
Ubikia helps produce faithful public forms of appearance.

---

## 3. What Ubikia Is Not

Ubikia is not primarily a social media manager.

It is not a generic content generator.

It is not a marketing automation tool.

It is not a CMS in the usual sense.

It is not designed to maximize engagement at the expense of fidelity.

Ubikia is designed to preserve the relation between:

```text
source corpus
  ↓
persona
  ↓
derived product
  ↓
platform
  ↓
publication record
  ↓
return to corpus
```

The goal is not to produce more content.

The goal is to make a corpus appear without losing itself.

---

## 4. Core Concepts

### 3.1 Source Corpus

A source corpus is the substance-bearing layer.

It may consist of:

- Markdown files;
- research notes;
- working papers;
- source essays;
- structured YAML or JSON;
- Git-tracked documents;
- concept maps;
- continuation prompts;
- conversation-derived materials;
- code and documentation.

A source corpus should be versioned, preferably through Git.

### 3.2 Derived Product

A derived product is a situated form generated from a source corpus for a specific audience, platform, persona, and purpose.

Examples:

```text
research/personas.md
  → academic article
  → public essay
  → Facebook post
  → LinkedIn post
  → technical specification
  → continuation prompt
```

A derived product is not necessarily inferior to its source. It is different in function.

### 3.3 Persona

A persona is a situated mode of appearance.

It defines how a source appears before a specific audience.

Examples:

- scholarly persona;
- public intellectual persona;
- technical architect persona;
- campaign persona;
- legal claimant persona;
- institutional persona;
- memorial persona;
- agentic coordination persona.

A persona must not capture or distort the source.

### 3.4 Platform

A platform is a scene or channel of publication.

Examples:

- GitHub;
- Substack;
- Medium;
- WordPress;
- Ghost;
- Facebook;
- LinkedIn;
- X;
- YouTube;
- podcast platforms;
- journal submission systems;
- conference submission systems.

Substack is a blogging platform, not a conceptual form.

Medium is another possible blogging platform.

A blog essay is a form.  
Substack or Medium are platforms.

### 3.5 Provenance

Provenance is the reconstructible link between a derived product and its source.

It should answer:

- What source was used?
- Which version?
- Which persona?
- Which audience?
- Which platform?
- Which constraints?
- Who or what generated the draft?
- Who reviewed it?
- Where was it published?
- What feedback returned to the corpus?

### 3.6 Publication Ledger

A publication ledger records where and how derived products appeared.

It prevents dispersion, duplication, and manual drift.

---

## 5. The Ubikia Publication Layer

Ubikia includes a publication layer.

The publication layer is not a writing agent.

It is a publication support layer.

The analogy is an artistic or publication agent.

An artistic agent does not create the artist’s work. The agent helps the work appear in the right venues, under the right conditions, to the right audiences, with the right timing and metadata.

Similarly, Ubikia should not be the author of the corpus. It should help derived products appear in publication scenes.

Possible functions:

- prepare platform-specific metadata;
- adapt titles, subtitles, tags, excerpts, and previews;
- prepare platform-specific formatting;
- generate publication checklists;
- prepare announcement posts;
- track where each product appears;
- preserve source links;
- warn when platform versions diverge;
- coordinate Substack, Medium, LinkedIn, Facebook, GitHub, and other channels;
- maintain a publication ledger;
- propose republication only when useful;
- require human validation for consequential publications.

Ubikia should reduce manual repetition without becoming autonomous over the corpus.

---

## 6. Workflow

A source-first derivation workflow may follow these steps.

### Step 1 — Select Source

Choose the source file or corpus state.

```text
cogentia/research/personas.md
```

### Step 2 — Select Form

Choose the derived form.

```text
academic_paper
public_essay
blog_essay
technical_brief
facebook_post
linkedin_post
x_thread
video_script
continuation_prompt
```

### Step 3 — Select Persona

Choose the mode of appearance.

```text
scholarly
public_intellectual
technical_architect
political_candidate
legal_claimant
institutional_voice
agentic_coordination
```

### Step 4 — Select Audience

Define who is addressed.

```text
scholars
citizens
developers
journalists
elected_officials
partners
AI_agents
existing_network
```

### Step 5 — Select Platform

Define the publication scene.

```text
github
substack
medium
facebook
linkedin
x
conference_system
journal_system
```

### Step 6 — Apply Constraints

Constraints may include:

- length;
- tone;
- citation level;
- formatting;
- metadata;
- source links;
- platform conventions;
- calls to action;
- review requirements;
- confidentiality limits.

### Step 7 — Generate Draft

Draft generation may be:

- human;
- AI-assisted;
- agent-assisted;
- template-based;
- hybrid.

### Step 8 — Review

Review should check:

- fidelity to source;
- persona fit;
- platform fit;
- factual accuracy;
- tone;
- provenance;
- risks of persona capture;
- publication readiness.

### Step 9 — Publish

Publication may be manual at first.

Automation should come later and remain supervised.

### Step 10 — Record

Update the publication ledger.

### Step 11 — Return to Corpus

Useful feedback, objections, corrections, and insights should return to the source corpus.

---

## 7. Minimal File Structure

A minimal file-based implementation may use this structure:

```text
ubikia/
  README.md
  docs/
    concepts.md
    derivation_workflow.md
    publication_layer.md
    publication_ledger.md
  schemas/
    source.schema.yaml
    persona.schema.yaml
    derived_product.schema.yaml
    publication.schema.yaml
    review.schema.yaml
  templates/
    academic_paper.yaml
    blog_essay.yaml
    facebook_post.yaml
    linkedin_post.yaml
    x_thread.yaml
    technical_brief.yaml
    continuation_prompt.yaml
  examples/
    personas/
      source.yaml
      derived_products.yaml
      publications.yaml
    machines_apparition/
      source.yaml
      derived_products.yaml
      publications.yaml
  cli/
    README.md
```

This structure should remain lightweight.

The first useful version does not need a full web app.

---

## 8. Minimal Data Structures

### 7.1 Source

```yaml
id: personas_source_v021
repository: cogentia
file: research/personas.md
status: working_paper
core_claim: >
  Personas are situated modes of appearance, and AI-mediated systems require
  governance of masks, cloaks, KYS certification, and persona capture.
key_terms:
  - persona
  - mask
  - cloak
  - KYS
  - persona_capture
```

### 7.2 Derived Product

```yaml
id: personas_blog_essay_v1
source: personas_source_v021
form: blog_essay
persona: public_intellectual
audience: general_public_cultivated
platform: substack
status: draft
constraints:
  - explain without excessive internal vocabulary
  - preserve mask/cloak distinction
  - avoid reducing persona to fake identity
review:
  required: true
  reviewer: Jean Hugues Noël Robert
```

### 7.3 Publication

```yaml
id: personas_substack_publication_v1
derived_product: personas_blog_essay_v1
platform: substack
status: planned
metadata:
  title: "Personas, masks and cloaks"
  subtitle: "Why AI agents will need governed visibility"
  tags:
    - AI
    - digital identity
    - Cogentia
    - persona
```

### 7.4 Deferred Platform Publication

```yaml
id: personas_medium_publication_v1
derived_product: personas_blog_essay_v1
platform: medium
status: deferred
reason: >
  Medium publication is postponed until Ubikia can automate metadata,
  formatting, source links, and publication tracking.
```

---

## 9. MVP Strategy

The first MVP should be simple.

### Phase 1 — File-Based Workflow

No database.

No web app.

Use Markdown and YAML files.

Goals:

- define sources;
- define personas;
- define derived products;
- define platform targets;
- track publication status;
- preserve provenance.

### Phase 2 — CLI

A minimal CLI could support commands such as:

```bash
ubikia init
ubikia source add cogentia/research/personas.md
ubikia derive personas_source_v021 --form blog_essay --platform substack
ubikia derive personas_source_v021 --form facebook_post --platform facebook
ubikia ledger add personas_substack_publication_v1
```

### Phase 3 — Assisted Generation

Add AI-assisted generation under human review.

```bash
ubikia draft personas_source_v021 --form blog_essay --persona public_intellectual
```

### Phase 4 — Publication Layer

Introduce Ubikia to prepare platform-specific publication packages.

```bash
ubikia prepare personas_blog_essay_v1 --platform substack
ubikia prepare personas_blog_essay_v1 --platform medium
```

### Phase 5 — Web Interface

Only after the file and CLI workflows are stable.

The web interface may provide:

- source selection;
- derivation wizard;
- preview;
- metadata editor;
- publication ledger;
- review status;
- platform packages;
- cross-publication tracking.

---

## 10. Example: `personas.md`

### Source

```text
cogentia/research/personas.md
```

### Derived Products

```text
personas.md
  → academic-style working paper
  → public blog essay
  → Facebook announcement
  → LinkedIn post
  → Ubikia technical specification fragment
  → continuation prompt
```

### Principle

The academic working paper is not the master source.

The source is the versioned corpus file.

All derived products should preserve their relation to that source.

---

## 11. Example: `machines_apparition.md`

### Source

```text
barons-Mariani/research/machines_apparition.md
```

### Possible Derived Products

```text
machines_apparition.md
  → academic article for science fiction studies / philosophy of technology
  → public blog essay
  → Facebook post
  → LinkedIn post
  → conference abstract
  → continuation prompt
```

### Possible Platforms

```text
GitHub
Substack
Medium
Facebook
LinkedIn
journal platform
conference submission platform
```

### Principle

The same source can appear as cultural criticism, academic argument, AI-governance reflection, public essay, and social announcement.

None of these appearances should become the source itself.

---

## 12. Governance Rules

### 11.1 Source Primacy Rule

The source corpus carries the substance.

### 11.2 Form Plurality Rule

No single form, including the academic paper, is sovereign over all others.

### 11.3 Platform Separation Rule

A platform is a scene of appearance, not a conceptual form.

### 11.4 Persona Explicitness Rule

Every consequential derived product should specify its persona.

### 11.5 Provenance Rule

Derived products should maintain a reconstructible link to their source.

### 11.6 Review Rule

Consequential derived products require human review.

### 11.7 Anti-Capture Rule

No audience, platform, persona, or form should be allowed to rewrite the source merely because it performs better.

### 11.8 Return Rule

Publication feedback should be able to return to the corpus.

---

## 13. Risks

### 12.1 Form Capture

A form becomes dominant and reshapes the source.

Example: the academic article becomes treated as the source, while the corpus becomes invisible.

### 12.2 Platform Capture

A platform rewards a style that distorts the source.

Example: a Facebook post becomes more polarizing than the corpus it derives from.

### 12.3 Persona Capture

The persona used for one scene begins to dominate all scenes.

Example: a campaign persona contaminates academic writing.

### 12.4 Metadata Loss

The derived product circulates without source reference.

Example: screenshots, reposts, summaries, copied text.

### 12.5 Manual Drift

Multiple platform versions are edited manually and become inconsistent.

### 12.6 Agentic Drift

A publication layer optimizes for reach, engagement, or convenience rather than fidelity.

---

## 14. Relation to Cogentia

Cogentia preserves cognitive coherence.

Ubikia organizes editorial derivation.

Ubikia manages publication appearance.

```text
Cogentia
  = coherence and cognitive traceability

Ubikia
  = derivation infrastructure

Ubikia
  = publication layer

GitHub
  = source infrastructure and provenance

Substack / Medium / social platforms
  = publication scenes
```

This relation should remain explicit.

Ubikia should not replace Cogentia.

Ubikia should not replace the author.

The publication layer serves the corpus.

It must not capture it.

---

## 15. Roadmap

### v0.1 — Conceptual README

- define Ubikia;
- define Ubikia;
- define source, product, platform, persona;
- clarify source-first derivation.

### v0.2 — Schemas

Create:

```text
schemas/source.schema.yaml
schemas/persona.schema.yaml
schemas/derived_product.schema.yaml
schemas/publication.schema.yaml
schemas/review.schema.yaml
```

### v0.3 — Examples

Create examples for:

```text
examples/personas/
examples/machines_apparition/
```

### v0.4 — CLI Prototype

Implement minimal commands:

```bash
ubikia init
ubikia derive
ubikia ledger
ubikia prepare
```

### v0.5 — Assisted Drafting

Add AI-assisted drafting with strict metadata and human review.

### v0.6 — Publication Packages

Generate platform-specific packages for:

```text
substack
medium
facebook
linkedin
x
github
```

### v0.7 — Web Interface

Add a simple interface for selecting sources, generating derived products, and tracking publications.

---

## 16. Continuation

Next work should proceed in this order:

1. validate this README;
2. create `docs/concepts.md`;
3. create `docs/derivation_workflow.md`;
4. create `docs/ubikia.md`;
5. define YAML schemas;
6. add example derivation chains;
7. implement a file-based CLI;
8. only later, build or revive the web application.

The first objective is not automation.

The first objective is conceptual and operational clarity.

---

## 17. Closing Formula

A corpus is not a publication.

A publication is an appearance of a corpus.

Ubikia exists to make that appearance possible, traceable, and faithful.

> Derive without betraying.
