# Future audible onboarding agent

## Status

This is a product-design note, not an implemented autonomous agent.

Ubikia is intended for people other than its initial author. A future onboarding agent may therefore be more useful than a static tutorial alone, provided that it remains inspectable, reversible, and explicit about publication boundaries.

## Role

The onboarding agent should help a user move from a written source to a reviewed publication package without silently publishing anything.

It should be able to:

1. inspect the local prerequisites;
2. explain the source/adaptation/prepared-text distinction;
3. create an adaptation workspace;
4. collect author, series, language, source URL, and disclosure metadata;
5. guide written-to-spoken adaptation;
6. run mechanical and semantic review checks;
7. select and configure a TTS provider;
8. render resumable audio segments;
9. assemble and normalize audio;
10. create artwork-backed video;
11. prepare a target-specific publication package;
12. stop before upload unless the user gives a distinct publication authorization;
13. record the publication result and return corrections to the source corpus.

## Interaction model

The agent should ask only for information that cannot be inferred safely. It should expose checkpoints such as:

```text
source selected
adaptation workspace created
spoken draft produced
spoken draft reviewed
audio rendered
audio reviewed
video generated
publication package reviewed
publication authorized
publication recorded
```

Each checkpoint should be recoverable after interruption.

## Safety and governance

The agent must not:

- treat a mechanical draft as a reviewed spoken product;
- upload a private source;
- publish because rendering succeeded;
- omit synthetic-voice disclosure when required by the target or chosen by the author;
- reuse a voice identity without authorization;
- overwrite a previous publication record without versioning;
- hide material changes introduced during adaptation;
- make a platform the only holder of provenance or canonical metadata.

## Architecture

The likely division is:

```text
Ubikia
  schemas, adaptation contracts, review rules,
  publication packages, provenance, target adapters

Inseme platform
  jobs, persistence, secrets, model routing,
  storage, resumability, connector execution

Onboarding agent
  user-facing orchestration over both layers
```

The onboarding agent may eventually expose the same workflow through conversational instructions, a CLI, or a small local web interface.

## Documentation strategy

Static documentation remains necessary for auditability and non-agent use. The agent should therefore derive its explanations from versioned documentation rather than becoming the only tutorial.

A mature release should provide:

- a five-minute quick start;
- a complete written tutorial;
- troubleshooting pages;
- example projects in several languages;
- an interactive onboarding agent;
- machine-readable capability and checkpoint descriptions.
