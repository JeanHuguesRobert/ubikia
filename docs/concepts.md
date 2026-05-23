# Ubikia Concepts
## Operational Glossary for Source-First Derivation

**Status:** Draft v0.2  
**Repository target:** `ubikia/docs/concepts.md`  
**Related documents:** `cogentia/research/personas.md`, `cogentia/research/derived_products.md`  
**Date:** 2026-05-23  

---

## 1. Purpose

This document defines the core operational concepts used by Ubikia.

Ubikia is an editorial derivation infrastructure for versioned corpora.

Its purpose is not generic content generation. Its purpose is governed derivation:

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

The central rule is:

> Derive without betraying.

---

## 2. Relation to Cogentia

Cogentia structures thought.

Ubikia structures appearance.

```text
Cogentia
  = coherence, cognition, corpus, signatures, continuations

Ubikia
  = derivation, publication, appearances, provenance
```

---

## 3. Source Corpus

A **source corpus** is the substance-bearing layer.

It contains the core material from which derived products are generated.

A source corpus may include Markdown files, working papers, research notes, source essays, concept definitions, code and documentation, conversation-derived material, structured YAML or JSON, continuation prompts, versioned datasets, references, and objections.

A source corpus should be versioned, preferably through Git.

### Minimal Example

```yaml
id: personas_source_v022
repository: cogentia
file: research/personas.md
type: working_paper
status: active
core_claim: >
  Personas are situated modes of appearance. AI-mediated systems require
  governance of masks, cloaks, certification, and persona capture.
```

### Rule

The source corpus carries the substance.

Publications are appearances of the corpus, not the corpus itself.

---

## 4. Source Unit

A **source unit** is the smallest source object that can be used for derivation.

Possible source units include repository, branch, commit, file, section, paragraph, concept, quote, issue, discussion, or conversation continuation.

Ubikia should allow different granularities.

### Example

```yaml
source_unit:
  repository: cogentia
  file: research/personas.md
  section: "Persona Capture"
  commit: pending
```

### Rule

The source unit should be precise enough to support provenance.

---

## 5. Derived Product

A **derived product** is a situated form generated from a source corpus for a specific audience, platform, persona, and purpose.

Examples include academic paper, public essay, blog essay, technical brief, policy note, campaign note, legal argument, social media post, video script, podcast outline, continuation prompt, and agent memory packet.

A derived product may reorganize, compress, expand, translate, formalize, dramatize, or operationalize the source.

### Minimal Example

```yaml
id: personas_blog_essay_v1
source: personas_source_v022
form: blog_essay
persona: public_intellectual
audience: general_public_cultivated
platform: substack
status: draft
```

### Rule

A derived product is not a degraded source. It is a situated appearance of the source.

---

## 6. Form

A **form** is the editorial shape of a derived product.

Forms include:

```text
academic_paper
working_paper
public_essay
blog_essay
technical_brief
policy_note
political_note
legal_argument
facebook_post
linkedin_post
x_thread
video_script
podcast_outline
conference_abstract
slide_deck
continuation_prompt
agent_memory_packet
```

### Rule

A form is not a platform.

A blog essay is a form.  
Substack and Medium are platforms.

---

## 7. Platform

A **platform** is the technical and social scene where a derived product appears.

Examples include GitHub, Substack, Medium, WordPress, Ghost, Facebook, LinkedIn, X, YouTube, podcast platforms, journal submission systems, and conference submission systems.

A platform shapes audience, formatting, metadata, distribution, interaction, moderation, archival stability, discoverability, reputation, and platform-specific risks.

### Rule

A platform should influence the product, but must not become the source.

---

## 8. Persona

A **persona** is a situated mode of appearance.

It defines how the source appears before a specific audience.

Examples include scholarly, public intellectual, technical architect, political candidate, legal claimant, institutional voice, memorial voice, and agentic coordination.

### Example

```yaml
persona:
  id: public_intellectual
  description: >
    Makes conceptual work publicly legible without reducing it to marketing
    or platform performance.
```

### Rule

A persona must remain subordinate to the source.

If the persona reshapes the source because it performs better, persona capture has begun.

---

## 9. Audience

An **audience** is the intended receiver of a derived product.

Examples include scholars, citizens, developers, journalists, elected officials, partners, local public, existing social network, AI agents, and review committees.

Audience affects vocabulary, length, examples, explanation level, references, call to action, tone, and assumed background knowledge.

### Rule

Audience adaptation is legitimate. Source betrayal is not.

---

## 10. Purpose

A **purpose** is the intended function of the derived product.

Examples include peer discussion, public explanation, campaign positioning, technical implementation, announcement, mobilization, documentation, agent coordination, submission, and memory transfer.

### Rule

Purpose should be explicit when stakes are non-trivial.

---

## 11. Constraint

A **constraint** is a formal, platform, audience, persona, legal, ethical, or strategic limitation applied to a derived product.

Examples include maximum length, citation level, no jargon, preserving exact terminology, including a source link, avoiding legal overclaim, using Unicode bold for Facebook publication, requiring human review, avoiding personal data, and not publishing automatically.

### Example

```yaml
constraints:
  - preserve distinction between persona and fake identity
  - explain cloak without implying fraud
  - include GitHub source link
  - require human review before publication
```

### Rule

Constraints should be machine-readable when possible.

---

## 12. Provenance

**Provenance** is the reconstructible relation between source and derived product.

It answers:

- What source was used?
- Which version or commit?
- Which source unit?
- Which persona?
- Which audience?
- Which form?
- Which platform?
- Which constraints?
- Who generated the draft?
- Who reviewed it?
- Where was it published?
- What feedback returned to the corpus?

### Rule

The higher the stakes, the stronger the provenance requirement.

---

## 13. Review

A **review** is the validation step before publication or use.

Review may check fidelity to source, factual accuracy, persona fit, audience fit, platform fit, legal risk, political risk, privacy risk, citation quality, tone, traceability, and publication readiness.

### Minimal Example

```yaml
review:
  required: true
  reviewer: Jean Hugues Noël Robert
  status: pending
  checklist:
    - source_fidelity
    - persona_fit
    - platform_formatting
    - publication_risk
```

### Rule

Consequential derived products require human review.

---

## 14. Publication

A **publication** is the act or record of placing a derived product on a platform.

Publication is distinct from the product itself.

The same derived product may have several publications:

```text
blog_essay
  → Substack publication
  → Medium publication
  → website archive
```

### Minimal Example

```yaml
publication:
  id: personas_substack_v1
  derived_product: personas_blog_essay_v1
  platform: substack
  status: planned
  url: pending
```

### Rule

Publication must not erase source provenance.

---

## 15. Publication Ledger

A **publication ledger** records appearances of source-derived products.

It may include:

```yaml
ledger_entry:
  source_id: personas_source_v022
  derived_product_id: personas_blog_essay_v1
  publication_id: personas_substack_v1
  platform: substack
  status: published
  url: pending
  published_at: pending
  feedback_returned_to_corpus: false
```

### Rule

The ledger prevents dispersion, duplication, and manual drift.

---

## 16. Return to Corpus

**Return to corpus** is the process by which feedback from derived products improves the source.

Feedback may come from comments, peer review, objections, corrections, public reactions, implementation failures, new examples, legal constraints, political responses, and agent-generated continuations.

### Rule

Publication is not the end of the process. It is a scene of testing.

---

## 17. Ubikia

**Ubikia** is the derivation infrastructure.

It manages the structured relation between:

```text
source
form
persona
audience
platform
constraints
derived product
review
publication
ledger
return to corpus
```

Ubikia should remain source-first.

### Rule

Ubikia derives. It does not betray.

---

## 17. Ubikia

**Ubikia** is the publication layer.

The publication layer is not a writing agent.  
It is a publication support layer.

It may prepare platform-specific metadata, prepare publication packages, generate announcement drafts, check source links, update the publication ledger, warn about divergence, suggest cross-publication, defer publication when automation is insufficient, and require human approval.

### Rule

Ubikia serves the corpus. It must not capture it.

---

## 19. Capture Risks

### 18.1 Form Capture

A form becomes dominant and reshapes the source.

Example: the academic paper becomes treated as the source.

### 18.2 Platform Capture

A platform rewards a style that distorts the source.

Example: a Facebook post becomes more polarizing than the source.

### 18.3 Persona Capture

A persona dominates all scenes.

Example: the campaign persona contaminates academic writing.

### 18.4 Manual Drift

Multiple manually edited platform versions become inconsistent.

### 18.5 Agentic Drift

A publication layer optimizes for reach, engagement, or convenience instead of fidelity.

---

## 20. Minimal Workflow Vocabulary

```text
select_source
select_form
select_persona
select_audience
select_platform
apply_constraints
draft_product
review_product
prepare_publication
publish_or_export
record_publication
return_feedback_to_corpus
```

These verbs may later become CLI commands or internal function names.

---

## 21. Closing Formula

The corpus carries the substance.

The derived product organizes the form.

The platform provides the scene.

The persona governs the appearance.

The ledger preserves the trace.

The publication layer manages publication.

Ubikia derives without betraying.
