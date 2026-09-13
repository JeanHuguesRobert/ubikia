---
title: "Observed appearance traces"
document_role: "operational"
document_kind: "implementation-note"
visibility: "public"
lifecycle_state: "experimental"
status: "working"
date: "2026-09-06"
repository: "ubikia"
related_documents:
  - "ubikia/docs/publication_layer.md"
  - "ubikia/research/publication_registry_exploration.md"
  - "inseme#61"
  - "inseme#63"
classification_source: "cogentia.js"
classification_version: "1"
classification_rule: "explicit-metadata"
classification_confidence: "medium"
legacy_document_role: "documentation"
---

# Observed appearance traces

## Purpose

An observed appearance is the smallest durable record of something that
actually appeared on an external publication platform. It is a source fact for
publication memory, not a claim about meaning, persona, mandate, impact, or
editorial intent.

The initial implementation is `ubikia.observed-appearance.v0.1` in
`src/publication/appearance-trace.js`.

## Boundary with COP

This format is deliberately an Ubikia source record, **not** itself a COP
`TraceDescriptor`. COP trace-centric work in Inseme issues #61 and #63 owns
the generic shared contract. `registerObservedAppearanceInCop()` in
`src/publication/cop-trace-adapter.js` bridges the two by calling injected COP
factories; it does not copy the COP schemas or event-envelope implementation.

```text
observed appearance
  -> external TraceRef / TraceDescriptor
  -> COP TraceObservation registration Event
  -> separate Assertion / EvidenceRelation / Projection
```

The registration event is attributable to the observer and explicitly states
`cop_originated: false`. Its descriptor points to the immutable appearance
record by identity, integrity hash and locator; it does not duplicate the
published text nor turn it into an assertion.

## Required observed core

```text
id
platform
kind
text_snapshot
text_snapshot_sha256
visibility
observed_at + precision
observed_by
publisher
locator
```

`canonical_url` is nullable. When a platform does not expose a direct stable
URL for a comment, `retrieval_locator` may retain the parent URL and minimal
locating context. A missing direct URL is recorded as missing; it is never
fabricated.

`observed_at_precision` prevents false temporal accuracy. Valid use includes
`exact`, `day`, `month`, `year`, `approximate`, and `unknown`.

## Later observations are appended

A later readback can reveal a direct comment permalink, a platform identifier,
an edit marker, or a more precise displayed time. It MUST create a separate
`ubikia.appearance-locator-observation.v0.1` record that points to the first
appearance by `appearance_ref`; it does not rewrite the earlier source fact.

```text
first observation: comment text + parent retrieval locator
later observation: direct comment locator + displayed edit marker
```

This is a small, concrete precursor to the COP rule that new traces affect
projections and assertions without erasing earlier traces.

## Deliberately excluded

The source record does not contain persona, role, political classification,
source derivation, mandate, intended audience, engagement, or impact. Those
are revisable interpretations and must be recorded separately with their
basis, author, review state, and schema version.

## Durable placement

The factual record belongs first to the represented Principal's TwinRoot. For
Jean Hugues Noel Robert, public appearances are partitioned by platform and
calendar period under `appearance-log/`. Ubikia supplies the adapter,
validation, and later projections; it is not the sole owner of every
Principal's source facts.

Fixed calendar paths make locations predictable. Segments may later be sealed
by volume or time without changing earlier records.
