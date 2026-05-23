# Ubikia Derivation Workflow
## From Versioned Source Corpus to Traceable Publication

**Status:** Draft v0.1  
**Repository target:** `ubikia/docs/derivation_workflow.md`  
**Related documents:** `ubikia/docs/concepts.md`, `cogentia/research/derived_products.md`, `cogentia/research/personas.md`  
**Date:** 2026-05-23  

---

## 1. Purpose

This document defines the operational workflow used by Ubikia to derive situated products from a versioned source corpus.

The workflow is source-first:

```text
source corpus
  ↓
source unit
  ↓
form
  ↓
persona
  ↓
audience
  ↓
platform
  ↓
constraints
  ↓
draft
  ↓
review
  ↓
publication package
  ↓
publication ledger
  ↓
return to corpus
```

The central rule is:

> Derive without betraying.

---

## 2. Workflow Overview

Ubikia derivation follows eleven steps:

1. select source;
2. identify source unit;
3. select form;
4. select persona;
5. select audience;
6. select platform;
7. apply constraints;
8. generate draft;
9. review product;
10. prepare publication;
11. record and return.

Each step should be explicit enough to preserve provenance, but lightweight enough to remain usable.

---

## 3. Step 1 — Select Source

The source is the substance-bearing corpus element.

Examples:

```text
cogentia/research/personas.md
cogentia/research/derived_products.md
barons-Mariani/research/machines_apparition.md
```

The source should ideally be versioned by Git.

### Minimal Metadata

```yaml
source:
  id: personas_source_v022
  repository: cogentia
  file: research/personas.md
  commit: pending
  status: working_paper
```

### Check

Before deriving, verify:

- the source exists;
- the source has a clear status;
- the source has a current version or commit;
- the core claim is identifiable;
- the source is suitable for derivation.

---

## 4. Step 2 — Identify Source Unit

A derived product may use the whole source or only part of it.

Source unit examples:

```text
whole_file
section
paragraph
concept
quote
issue
conversation_continuation
```

### Example

```yaml
source_unit:
  type: section
  title: "Persona Capture"
  file: research/personas.md
```

### Rule

Use the smallest source unit that preserves context.

Too broad: poor traceability.  
Too narrow: risk of distortion.

---

## 5. Step 3 — Select Form

The form is the editorial shape of the product.

Examples:

```text
academic_paper
working_paper
blog_essay
public_essay
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
```

### Example

```yaml
form: blog_essay
```

### Check

Ask:

- Is the selected form appropriate to the purpose?
- Does the form impose length or structure constraints?
- Does the form require citations?
- Does the form require a specific tone?
- Does the form require human review?

---

## 6. Step 4 — Select Persona

The persona governs how the source appears.

Examples:

```text
scholarly
public_intellectual
technical_architect
political_candidate
legal_claimant
institutional_voice
memorial_voice
agentic_coordination
```

### Example

```yaml
persona: public_intellectual
```

### Check

Ask:

- Is the persona legitimate for the source?
- Does the persona risk distorting the source?
- Is the persona suitable for the audience?
- Is there a risk of persona capture?

---

## 7. Step 5 — Select Audience

The audience is the intended receiver.

Examples:

```text
scholars
citizens
developers
journalists
elected_officials
partners
local_public
existing_social_network
ai_agents
review_committee
```

### Example

```yaml
audience: general_public_cultivated
```

### Check

Ask:

- What does the audience already know?
- What must be explained?
- What vocabulary should be avoided?
- What examples will make the source legible?
- What level of detail is appropriate?

---

## 8. Step 6 — Select Platform

The platform is the publication scene.

Examples:

```text
github
substack
medium
facebook
linkedin
x
youtube
journal_submission_system
conference_submission_system
```

### Example

```yaml
platform: substack
```

### Check

Ask:

- Is the platform suitable for this product?
- What formatting constraints apply?
- What metadata are required?
- What risks of platform capture exist?
- Should publication be deferred until automation is available?

---

## 9. Step 7 — Apply Constraints

Constraints shape derivation.

Examples:

```yaml
constraints:
  - preserve source terminology
  - avoid excessive internal vocabulary
  - include source link
  - require human review
  - use unicode_bold_for_facebook: true
  - avoid legal overclaim
  - do_not_publish_automatically
```

### Constraint Types

```text
formal
platform
audience
persona
legal
ethical
strategic
privacy
review
traceability
```

### Rule

Constraints should be explicit and, when possible, machine-readable.

---

## 10. Step 8 — Generate Draft

Draft generation may be:

```text
human
AI-assisted
agent-assisted
template-based
hybrid
```

### Draft Metadata

```yaml
draft:
  generated_by: human_ai_collaboration
  tool: pending
  date: 2026-05-23
  status: draft
```

### Rule

Generation is not publication.

A draft must not be treated as validated output.

---

## 11. Step 9 — Review Product

Review checks whether the derived product is publishable.

### Review Checklist

```yaml
review:
  required: true
  reviewer: Jean Hugues Noël Robert
  checklist:
    - source_fidelity
    - core_claim_preserved
    - persona_fit
    - audience_fit
    - platform_fit
    - factual_accuracy
    - citation_quality
    - legal_risk
    - privacy_risk
    - tone
    - provenance
    - publication_readiness
```

### Review Outcomes

```text
approved
approved_with_minor_edits
needs_revision
rejected
deferred
```

### Rule

Consequential products require human review.

---

## 12. Step 10 — Prepare Publication

Publication preparation creates a platform-specific package.

A publication package may include:

- title;
- subtitle;
- slug;
- tags;
- excerpt;
- body;
- source link;
- canonical URL;
- image prompt or image reference;
- announcement text;
- platform-specific formatting;
- publication checklist.

### Example

```yaml
publication_package:
  platform: substack
  title: "Personas, Masks, and Cloaks"
  subtitle: "Why AI agents will need governed visibility"
  tags:
    - AI
    - digital_identity
    - Cogentia
  canonical_source: cogentia/research/personas.md
  status: ready_for_manual_publication
```

### Rule

Platform preparation should not rewrite the source without review.

---

## 13. Step 11 — Record and Return

After publication, update the publication ledger.

### Ledger Entry

```yaml
ledger_entry:
  id: personas_substack_v1
  source_id: personas_source_v022
  derived_product_id: personas_blog_essay_v1
  platform: substack
  status: published
  url: pending
  published_at: pending
  persona: public_intellectual
  audience: general_public_cultivated
  feedback_returned_to_corpus: false
```

### Return to Corpus

If publication produces useful feedback, record it.

```yaml
return_to_corpus:
  source_id: personas_source_v022
  feedback_type: objection
  origin: public_comment
  action:
    - review_source_section
    - add_open_question
    - update_next_version
```

### Rule

Publication is a scene of testing, not the end of the process.

---

## 14. Full Example: `personas.md` to Blog Essay

```yaml
derivation:
  id: personas_blog_essay_v1
  source:
    repository: cogentia
    file: research/personas.md
    commit: pending
  source_unit:
    type: whole_file
  form: blog_essay
  persona: public_intellectual
  audience: general_public_cultivated
  platform: substack
  purpose: public_explanation
  constraints:
    - avoid excessive internal vocabulary
    - explain persona as situated appearance
    - preserve mask_cloak_KYS_distinctions
    - include GitHub source link
    - require human review
  draft:
    generated_by: human_ai_collaboration
    status: draft
  review:
    required: true
    status: pending
  publication:
    platform: substack
    status: planned
```

---

## 15. Full Example: Blog Essay to Facebook Announcement

This derivation may use the blog essay as an intermediate product, but the Facebook post should still preserve its source relation.

```yaml
derivation:
  id: personas_facebook_announcement_v1
  source:
    repository: cogentia
    file: research/personas.md
    commit: pending
  intermediate_product: personas_blog_essay_v1
  form: facebook_post
  persona: public_author
  audience: existing_social_network
  platform: facebook
  purpose: announce_publication
  constraints:
    - unicode_bold_for_important_passages
    - include blog_link
    - avoid overtechnical_vocabulary
    - preserve_core_claim
    - do_not_overstate_KYS
  review:
    required: true
```

### Rule

Using an intermediate product is acceptable, but the source relation must remain visible.

---

## 16. Full Example: `machines_apparition.md` to Academic Article

```yaml
derivation:
  id: machines_academic_article_v1
  source:
    repository: barons-Mariani
    file: research/machines_apparition.md
    commit: pending
  form: academic_article
  persona: scholarly
  audience: science_fiction_studies_or_philosophy_of_technology
  platform: journal_submission_system
  possible_venues:
    - ReS_Futurae
    - Appareil
  purpose: peer_discussion
  constraints:
    - add_related_work
    - reduce_internal_corpus_vocabulary
    - cite_Ranciere_precisely
    - distinguish_primary_sources_and_theory
    - preserve_core_claim_about_machines_as_operators_of_appearance
  review:
    required: true
```

---

## 17. Capture Checks

Before publication, run capture checks.

### 17.1 Source Betrayal Check

Does the product contradict the source?

### 17.2 Persona Capture Check

Does the persona dominate or distort the source?

### 17.3 Platform Capture Check

Does the platform reward a distortion that has entered the product?

### 17.4 Form Capture Check

Is the form being treated as if it were the source?

### 17.5 Manual Drift Check

Has a manually edited version diverged from the source?

### 17.6 Agentic Drift Check

Has an agent optimized the product for convenience, engagement, or fluency rather than fidelity?

---

## 18. CLI Implications

The workflow suggests future CLI commands.

```bash
ubikia source add cogentia/research/personas.md
ubikia derive personas_source_v022 --form blog_essay --platform substack
ubikia review personas_blog_essay_v1
ubikia prepare personas_blog_essay_v1 --platform substack
ubikia ledger add personas_substack_v1
ubikia feedback add personas_substack_v1 --type objection
```

These commands should remain simple wrappers around file-based metadata at first.

---

## 19. Minimum Viable Workflow

A first manual version can work with only:

```text
source.yaml
derived_product.yaml
publication.yaml
ledger.yaml
```

Minimum manual workflow:

1. write or update source;
2. create derived product metadata;
3. generate draft;
4. review manually;
5. publish manually;
6. update ledger manually;
7. record useful feedback.

Automation can come later.

---

## 20. Closing Formula

A source is not published once.

It appears many times.

Ubikia exists to make those appearances coherent, traceable, and faithful.

> Derive without betraying.
