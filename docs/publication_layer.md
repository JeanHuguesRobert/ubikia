---
document_role: "source"
document_kind: "documentation"
visibility: "public"
lifecycle_state: "active"
classification_source: "cogentia.js"
classification_version: "1"
classification_rule: "documentation"
classification_confidence: "medium"
---

# Ubikia Publication Layer
## Platform Packages, Publication Ledger, and Supervised Distribution

**Status:** Draft v0.1  
**Repository target:** `ubikia/docs/publication_layer.md`  
**Related documents:** `ubikia/docs/concepts.md`, `ubikia/docs/derivation_workflow.md`  
**Date:** 2026-05-23  

---

## 1. Purpose

This document defines the publication layer of Ubikia.

The publication layer is the component that prepares, tracks, and eventually automates the appearance of derived products on publication platforms.

It is not the author of the corpus.

It is not a writing agent.

It is a publication support layer.

Its task is to help derived products appear in the right scene, under the right form, with the right metadata, while preserving provenance and human control.

---

## 2. Position in Ubikia

Ubikia manages the full derivation chain:

```text
source corpus
  ↓
derived product
  ↓
review
  ↓
publication package
  ↓
publication
  ↓
ledger
  ↓
return to corpus
```

The publication layer begins after a derived product has reached reviewable or approved status.

It should not rewrite the source.

It should not silently alter the derived product.

It should not publish consequential materials without human approval.

---

## 3. Core Principle

The core principle is:

> Publication is an appearance of a derived product, not the source itself.

A source may produce a blog essay.

The blog essay may be published on Substack.

The same blog essay may later be adapted for Medium.

Each publication should remain connected to:

- the source corpus;
- the derived product;
- the persona;
- the platform;
- the publication date;
- the publication status;
- the review status;
- the public URL, when available;
- any feedback returned to the corpus.

---

## 4. Publication Package

A **publication package** is the platform-specific bundle needed to publish or manually copy a derived product.

It may contain:

- title;
- subtitle;
- slug;
- excerpt;
- body;
- tags;
- categories;
- canonical source link;
- canonical public link;
- author / persona;
- publication date;
- image or thumbnail;
- image alt text;
- platform-specific formatting notes;
- announcement posts;
- review checklist;
- publication status.

### Example

```yaml
publication_package:
  id: personas_substack_package_v1
  derived_product: personas_blog_essay_v1
  platform: substack
  status: ready_for_manual_publication
  title: "Personas, Masks, and Cloaks"
  subtitle: "Why AI agents will need governed visibility"
  tags:
    - AI
    - digital_identity
    - Cogentia
  canonical_source:
    repository: cogentia
    file: research/personas.md
    commit: pending
  review:
    status: approved
    reviewer: Jean Hugues Noël Robert
```

---

## 5. Platform Profiles

A platform profile describes how to prepare a publication package for a specific platform.

### 5.1 Substack

```yaml
platform_profile:
  id: substack
  type: blogging_platform
  supports:
    - title
    - subtitle
    - body
    - tags
    - email_distribution
    - web_publication
  constraints:
    - manual_publication_initially
    - preserve_source_link
    - prepare_social_preview
  risks:
    - audience_lock_in
    - newsletter_fatigue
    - manual_copy_drift
```

### 5.2 Medium

```yaml
platform_profile:
  id: medium
  type: blogging_platform
  supports:
    - title
    - subtitle
    - body
    - tags
    - canonical_url
  constraints:
    - deferred_until_automation
    - avoid_manual_duplicate_work
    - preserve_canonical_source_or_blog_link
  risks:
    - duplicate_version_drift
    - weak_source_traceability
```

### 5.3 Facebook

```yaml
platform_profile:
  id: facebook
  type: social_platform
  supports:
    - post_text
    - link_preview
    - image
    - comments
  constraints:
    - short_public_hook
    - unicode_bold_allowed_for_posts
    - avoid_overtechnical_vocabulary
    - source_or_article_link_required
  risks:
    - context_collapse
    - affective_polarization
    - comment_drift
    - platform_capture
```

### 5.4 LinkedIn

```yaml
platform_profile:
  id: linkedin
  type: professional_social_platform
  supports:
    - post_text
    - link_preview
    - article
    - comments
  constraints:
    - professional_framing
    - avoid_excessive_internal_vocabulary
    - clarify_relevance_to_work_or_innovation
  risks:
    - corporate_flattening
    - thought_leadership_cliche
    - engagement_optimization
```

### 5.5 GitHub

```yaml
platform_profile:
  id: github
  type: source_infrastructure
  supports:
    - markdown
    - commits
    - pull_requests
    - issues
    - discussions
    - tags
    - releases
  constraints:
    - preserve_version_history
    - prefer_source_files
    - link_to_derived_publications
  risks:
    - treating_github_as_only_for_code
    - poor_public_readability
```

---

## 6. Publication Status

Publication status should be explicit.

```text
planned
draft_package
ready_for_review
approved
ready_for_manual_publication
published
updated
archived
superseded
deferred
cancelled
```

### Example

```yaml
publication:
  id: personas_substack_publication_v1
  package: personas_substack_package_v1
  platform: substack
  status: ready_for_manual_publication
```

---

## 7. Manual Publication First

The first implementation should assume manual publication.

Manual publication is not a failure. It is the safest first stage.

The publication layer should prepare:

- clean body text;
- title;
- subtitle;
- tags;
- source link;
- preview text;
- announcement posts;
- checklist.

The human then publishes manually.

After publication, the public URL is added to the ledger.

### Rule

Automation should reduce repetition only after provenance and review are stable.

---

## 8. Deferred Publication

A platform may be useful but deferred.

Example: Medium may be desirable as an additional blogging platform, but publishing manually on both Substack and Medium creates too much duplication and drift.

### Example

```yaml
publication:
  id: personas_medium_publication_v1
  derived_product: personas_blog_essay_v1
  platform: medium
  status: deferred
  reason: >
    Publication on Medium is deferred until Ubikia can automate metadata,
    formatting, source links, canonical links, and ledger updates.
```

### Rule

Do not multiply publication scenes before the publication layer can govern them.

---

## 9. Announcement Packages

A publication package may generate one or more announcement packages.

Example:

```text
blog essay on Substack
  ↓
Facebook announcement
  ↓
LinkedIn announcement
  ↓
X thread
```

An announcement is itself a derived product.

It should have metadata.

### Example

```yaml
announcement_package:
  id: personas_facebook_announcement_v1
  source_publication: personas_substack_publication_v1
  original_source: personas_source_v022
  form: facebook_post
  platform: facebook
  persona: public_author
  constraints:
    - unicode_bold_for_important_passages
    - include_substack_link
    - preserve_core_claim
    - avoid_excessive_internal_vocabulary
```

### Rule

An announcement should not become a distorted substitute for the source.

---

## 10. Publication Ledger

The publication ledger records appearances.

### Ledger Entry

```yaml
ledger_entry:
  id: personas_substack_v1
  source_id: personas_source_v022
  derived_product_id: personas_blog_essay_v1
  publication_package_id: personas_substack_package_v1
  platform: substack
  status: published
  url: pending
  published_at: pending
  persona: public_intellectual
  audience: general_public_cultivated
  canonical_source:
    repository: cogentia
    file: research/personas.md
    commit: pending
  feedback_returned_to_corpus: false
```

The ledger should support later queries:

- Where has this source appeared?
- Which product was published where?
- Which platforms are deferred?
- Which publications need updates?
- Which products are superseded?
- Which feedback returned to the corpus?

---

## 11. Canonical Links

Canonical links prevent confusion between source, derived product, and publication.

### Link Types

```text
source_link
derived_product_link
publication_link
canonical_public_link
canonical_source_link
```

### Example

```yaml
links:
  source_link: https://github.com/.../cogentia/research/personas.md
  publication_link: https://substack.com/...
  canonical_public_link: https://substack.com/...
```

### Rule

A platform publication should point back to the source or to a stable source page when appropriate.

---

## 12. Update and Supersession

Publications may become outdated when the source evolves.

The publication layer should track:

- publication date;
- source version;
- derived product version;
- whether a newer version exists;
- whether the publication is superseded;
- whether an update notice is needed.

### Example

```yaml
supersession:
  publication: personas_substack_v1
  status: superseded
  superseded_by: personas_substack_v2
  reason: source_updated_to_v0.3
```

### Rule

A publication may remain useful even if superseded, but its status should be knowable.

---

## 13. Feedback Capture

Feedback may come from:

- comments;
- emails;
- peer review;
- social replies;
- platform analytics;
- implementation attempts;
- objections;
- corrections;
- requests for clarification.

The publication layer should not treat all feedback equally.

### Feedback Types

```text
objection
correction
support
question
misunderstanding
implementation_issue
new_example
citation_needed
platform_signal
```

### Example

```yaml
feedback:
  id: personas_feedback_001
  publication: personas_substack_v1
  type: objection
  summary: >
    Reader argues that the KYS levels are too arbitrary.
  action:
    - add_to_open_questions
    - consider_certification_dimensions
```

### Rule

Feedback should return to the corpus only when it improves the source.

---

## 14. Human Approval

The publication layer should distinguish between:

```text
prepare
suggest
export
publish
update
delete
archive
```

Only some actions may be automated.

### Default Policy

```yaml
human_approval:
  prepare: false
  suggest: false
  export: false
  publish: true
  update: true
  delete: true
  archive: true
```

### Rule

Consequential publication requires human approval.

---

## 15. Automation Levels

Publication automation should be gradual.

### Level 0 — Manual

Ubikia only stores metadata and checklists.

### Level 1 — Package Preparation

Ubikia prepares text, metadata, tags, and source links.

### Level 2 — Export

Ubikia exports platform-ready Markdown or plain text.

### Level 3 — Assisted Publishing

Ubikia opens or prepares platform drafts.

### Level 4 — Supervised Publishing

Ubikia can publish after explicit human approval.

### Level 5 — Conditional Automation

Ubikia can publish low-stakes materials under predefined rules.

### Rule

Do not skip levels.

---

## 16. Platform Drift Checks

Before publication or republication, Ubikia should check:

- has the source changed?
- has the derived product changed?
- has the platform version been manually edited?
- is the platform version missing source links?
- is the publication status outdated?
- is the platform incentivizing distortion?
- does this platform publication duplicate another one?

### Example

```yaml
drift_check:
  publication: personas_medium_publication_v1
  result: deferred
  reason: >
    Medium version would require manual copy and metadata maintenance.
    Defer until automated package generation exists.
```

---

## 17. Current Practical Rule

At the current stage, a practical rule is:

```text
GitHub
  = source infrastructure

Substack
  = main blogging platform

Facebook / LinkedIn
  = selective announcements

Medium
  = deferred until automation

Other platforms
  = later, if justified by audience and automation
```

This rule is practical, not doctrinal.

When Ubikia matures, additional platforms can be added without manual overload.

---

## 18. Minimal File Structure

```text
ubikia/
  publication/
    ledger.yaml
    platforms/
      substack.yaml
      medium.yaml
      facebook.yaml
      linkedin.yaml
      github.yaml
    packages/
      personas_substack_package_v1.yaml
      personas_facebook_announcement_v1.yaml
```

Or, if keeping all examples together:

```text
ubikia/
  examples/
    personas/
      source.yaml
      derived_products.yaml
      publications.yaml
      feedback.yaml
```

---

## 19. CLI Implications

Future commands may include:

```bash
ubikia prepare personas_blog_essay_v1 --platform substack
ubikia package personas_blog_essay_v1 --platform medium
ubikia defer personas_blog_essay_v1 --platform medium --reason "automation not ready"
ubikia publish personas_substack_package_v1 --manual
ubikia ledger add personas_substack_v1
ubikia feedback add personas_substack_v1 --type objection
ubikia status personas_source_v022
```

At first, these commands should only manipulate local files.

---

## 20. Closing Formula

The publication layer is not the author.

It is the steward of appearances.

It prepares, records, and tracks where derived products appear.

It must reduce manual work without increasing drift.

It must expand publication without letting platforms capture the corpus.

> Publish without losing provenance.
