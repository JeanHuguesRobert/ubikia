# Governed written-to-spoken adaptation

## Purpose

A written essay is not automatically a good listening script. Ubikia therefore treats spoken adaptation as a distinct derived-product stage rather than as Markdown cleanup.

```text
written source
  -> spoken adaptation workspace
  -> reviewed spoken product
  -> TTS preparation
  -> audio rendering
```

The written source remains authoritative. The spoken product may improve rhythm, sentence length, transitions, enumerations, acronym expansion, and treatment of references, but it must not silently change the substance.

## Files in an adaptation workspace

```text
source.md
spoken.draft.md
adaptation-request.md
adaptation.json
```

- `source.md` is the preserved written input.
- `spoken.draft.md` is initially a mechanical baseline, not a reviewed adaptation.
- `adaptation-request.md` is a provider-neutral mandate that can be given to a human editor, coding agent, conversational agent, or LLM adapter.
- `adaptation.json` records source and draft hashes, status, metadata, basic validation warnings, and the human-review requirement.

A reviewed workflow should later add:

```text
spoken.reviewed.md
review.json
```

No automation should rename a draft as reviewed without an explicit review act.

## Create a workspace

From the repository root:

```powershell
npm run audible:adapt -- source.md artifacts\audible\episode
```

The command is intentionally usable without an LLM provider. It creates a stable workspace that another agent or editor can continue.

Optional metadata can be supplied with direct Node arguments:

```powershell
node cli\audible-adapt.js `
  --input source.md `
  --output artifacts\audible\episode `
  --title "Episode title" `
  --series "Series name" `
  --author "Author name" `
  --language fr `
  --source-url "https://example.org/article"
```

## Adaptation contract

An adaptation must:

- preserve theses, distinctions, qualifications, reservations, and attributions;
- avoid invented facts, examples, arguments, and conclusions;
- shorten or split sentences when this improves listening;
- convert visual lists into audible enumerations;
- convert headings into spoken transitions;
- expand unclear abbreviations at first occurrence;
- replace raw URLs with a reference to the written version;
- reformulate parentheses, footnotes, tables, and visual cross-references;
- remain in the source language unless translation is an explicit separate operation;
- remain marked unreviewed until omissions and additions have been checked.

## Mechanical validation

Ubikia currently performs limited checks:

- source/spoken character ratio;
- numeric tokens present in the source but absent from the spoken draft;
- raw URLs left in spoken text;
- Markdown headings or code fences left in spoken text.

These checks detect some obvious failures. They do not establish semantic fidelity. A future governed review agent should compare claims, named entities, quotations, numbers, negations, modalities, and conclusions.

## Rendering the reviewed spoken product

The CLI accepts a third positional argument:

```powershell
npm run audible:render -- `
  source.md `
  artifacts\audible\episode `
  artifacts\audible\episode\spoken.reviewed.md
```

The audio manifest then records separate hashes and references for:

- the written source;
- the spoken adaptation;
- the final TTS-prepared text.

## Provider neutrality

The adaptation stage is deliberately independent from Gradium. A user may use:

- a human editor;
- a local model;
- a hosted LLM;
- an Inseme/COP agent;
- a future Ubikia adaptation service.

Ubikia governs the input, output, state, provenance, and review boundary. The platform layer may later provide execution, model selection, secrets, persistence, and retries.
