import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { prepareMarkdownForSpeech } from "./prepare-text.js";

export async function createSpokenAdaptationWorkspace({
  sourceText,
  outputDirectory,
  metadata = {},
} = {}) {
  if (typeof sourceText !== "string" || sourceText.trim() === "") {
    throw new TypeError("sourceText must be a non-empty string");
  }
  if (!outputDirectory) throw new Error("outputDirectory is required");

  const absoluteDirectory = path.resolve(outputDirectory);
  await mkdir(absoluteDirectory, { recursive: true });

  const sourceFilename = "source.md";
  const draftFilename = "spoken.draft.md";
  const requestFilename = "adaptation-request.md";
  const manifestFilename = "adaptation.json";

  const mechanicalDraft = buildMechanicalDraft(sourceText, metadata);
  const request = buildSpokenAdaptationPrompt(metadata);
  const validation = validateSpokenAdaptation({
    sourceText,
    spokenText: mechanicalDraft,
  });

  const manifest = {
    schema: "ubikia.spoken-adaptation.v0.1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "draft_unreviewed",
    source: {
      filename: sourceFilename,
      reference: metadata.sourceReference ?? null,
      url: metadata.sourceUrl ?? null,
      sha256: sha256(sourceText),
    },
    spoken_product: {
      filename: draftFilename,
      sha256: sha256(mechanicalDraft),
      language: metadata.language ?? null,
      title: metadata.title ?? null,
      series: metadata.series ?? null,
      author: metadata.author ?? null,
      adaptation_method: "mechanical_baseline",
      substantive_changes_allowed: false,
      human_review_required: true,
      reviewed: false,
    },
    adaptation_request: requestFilename,
    validation,
  };

  await Promise.all([
    writeFile(path.join(absoluteDirectory, sourceFilename), ensureFinalNewline(sourceText), "utf8"),
    writeFile(path.join(absoluteDirectory, draftFilename), ensureFinalNewline(mechanicalDraft), "utf8"),
    writeFile(path.join(absoluteDirectory, requestFilename), ensureFinalNewline(request), "utf8"),
    writeFile(
      path.join(absoluteDirectory, manifestFilename),
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    ),
  ]);

  return manifest;
}

export function buildSpokenAdaptationPrompt({
  title = null,
  series = null,
  author = null,
  language = "the source language",
  audience = "an attentive general audience",
  sourceUrl = null,
  intro = null,
  outro = null,
  additionalConstraints = [],
} = {}) {
  const context = [
    title ? `Title: ${title}` : null,
    series ? `Series: ${series}` : null,
    author ? `Author: ${author}` : null,
    `Output language: ${language}`,
    `Audience: ${audience}`,
    sourceUrl ? `Written reference URL: ${sourceUrl}` : null,
  ].filter(Boolean);

  const constraints = [
    "Preserve every thesis, distinction, reservation, qualification, and attribution.",
    "Do not invent facts, examples, arguments, transitions of substance, or conclusions.",
    "Do not silently summarize passages whose details matter to the reasoning.",
    "Rewrite long written sentences into shorter spoken units when useful.",
    "Turn visual lists into explicit spoken enumerations.",
    "Turn headings into audible transitions rather than reading Markdown syntax.",
    "Develop abbreviations at first occurrence when their pronunciation or meaning may be unclear.",
    "Replace raw URLs and dense bibliographic references with a short reference to the written version.",
    "Rephrase parentheses, footnotes, tables, and visual cross-references for listeners.",
    "Use repetition only when it helps a listener recover context.",
    "Return spoken prose only. Do not add commentary about the adaptation process.",
    "The written source remains authoritative. The result is a derived spoken product.",
    ...additionalConstraints,
  ];

  return `# Spoken adaptation request\n\n## Context\n\n${context.map((line) => `- ${line}`).join("\n")}\n\n## Task\n\nAdapt the contents of \`source.md\` for attentive audio listening. Write the result to \`spoken.draft.md\`.\n\n## Constraints\n\n${constraints.map((line) => `- ${line}`).join("\n")}\n\n## Optional framing\n\n- Intro: ${intro ?? "No automatic intro. Add one only if explicitly approved."}\n- Outro: ${outro ?? "No automatic outro. Add one only if explicitly approved."}\n\n## Required review\n\nThe output must remain marked unreviewed until a human or governed review process has checked omissions, additions, numbers, names, quotations, and changes of meaning.\n`;
}

export function validateSpokenAdaptation({ sourceText, spokenText }) {
  if (typeof sourceText !== "string" || typeof spokenText !== "string") {
    throw new TypeError("sourceText and spokenText must be strings");
  }

  // YAML front matter describes the publication record, not the prose that the
  // listener should hear. Dates, versions, postal codes and licence numbers in
  // that block must therefore not create false omission warnings.
  const sourceBody = stripYamlFrontMatter(sourceText);
  const sourceNumbers = unique(sourceBody.match(/\b\d+(?:[.,]\d+)?%?\b/g) ?? []);
  const spokenNumbers = new Set(spokenText.match(/\b\d+(?:[.,]\d+)?%?\b/g) ?? []);
  const missingNumbers = sourceNumbers.filter((number) => !spokenNumbers.has(number));
  const lengthRatio = sourceBody.length === 0 ? null : spokenText.length / sourceBody.length;

  const warnings = [];
  if (lengthRatio !== null && lengthRatio < 0.55) {
    warnings.push("The spoken draft is much shorter than the source body; check for omissions.");
  }
  if (lengthRatio !== null && lengthRatio > 1.45) {
    warnings.push("The spoken draft is much longer than the source body; check for additions.");
  }
  if (missingNumbers.length > 0) {
    warnings.push("Some numeric tokens from the source body are absent from the spoken draft.");
  }
  if (/https?:\/\/\S+/i.test(spokenText)) {
    warnings.push("The spoken draft still contains a raw URL.");
  }
  if (/^#{1,6}\s/m.test(spokenText) || /```/.test(spokenText)) {
    warnings.push("The spoken draft still contains structural Markdown unsuitable for direct speech.");
  }

  return {
    status: warnings.length === 0 ? "mechanical_checks_passed" : "review_required",
    validation_basis: "source_body_without_yaml_front_matter",
    source_characters: sourceText.length,
    source_body_characters: sourceBody.length,
    spoken_characters: spokenText.length,
    length_ratio: lengthRatio,
    missing_numeric_tokens: missingNumbers,
    warnings,
    human_review_required: true,
  };
}

function stripYamlFrontMatter(value) {
  const normalized = value.startsWith("\uFEFF") ? value.slice(1) : value;
  const lines = normalized.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return normalized;

  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === "---") {
      return lines.slice(index + 1).join("\n");
    }
  }

  // An unclosed delimiter is not valid front matter; validate the whole source
  // rather than silently discarding its contents.
  return normalized;
}

function buildMechanicalDraft(sourceText, metadata) {
  const body = prepareMarkdownForSpeech(sourceText);
  return [metadata.intro, body, metadata.outro]
    .filter((part) => typeof part === "string" && part.trim() !== "")
    .map((part) => part.trim())
    .join("\n\n");
}

function unique(values) {
  return [...new Set(values)];
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function ensureFinalNewline(value) {
  return value.endsWith("\n") ? value : `${value}\n`;
}
