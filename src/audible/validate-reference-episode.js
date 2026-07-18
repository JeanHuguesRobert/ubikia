import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { validateSpokenAdaptation } from "./adapt.js";

const REQUIRED_FILES = [
  "episode.json",
  "source.md",
  "spoken.draft.md",
  "review.template.json",
  "youtube.metadata.json",
  "pronunciation-audition.txt",
  "RUNBOOK.md",
];

/**
 * Validate a version-controlled reference episode without TTS credentials.
 */
export async function validateReferenceEpisode(projectDirectory) {
  if (!projectDirectory) throw new Error("projectDirectory is required");
  const absoluteDirectory = path.resolve(projectDirectory);
  const errors = [];
  const warnings = [];

  for (const filename of REQUIRED_FILES) {
    try {
      await access(path.join(absoluteDirectory, filename));
    } catch {
      errors.push(`Missing required file: ${filename}`);
    }
  }

  if (errors.length > 0) {
    return {
      status: "invalid",
      project: absoluteDirectory,
      errors,
      warnings,
    };
  }

  const [episode, sourceText, spokenText, reviewTemplate, youtubeMetadata, auditionText] = await Promise.all([
    readJson(path.join(absoluteDirectory, "episode.json")),
    readFile(path.join(absoluteDirectory, "source.md"), "utf8"),
    readFile(path.join(absoluteDirectory, "spoken.draft.md"), "utf8"),
    readJson(path.join(absoluteDirectory, "review.template.json")),
    readJson(path.join(absoluteDirectory, "youtube.metadata.json")),
    readFile(path.join(absoluteDirectory, "pronunciation-audition.txt"), "utf8"),
  ]);

  if (episode.schema !== "ubikia.reference-episode.v0.1") {
    errors.push(`Unexpected episode schema: ${episode.schema}`);
  }
  if (!episode.source?.commit) errors.push("episode.source.commit is required");
  if (!episode.source?.blob_sha) errors.push("episode.source.blob_sha is required");
  if (!episode.persona?.authorial) errors.push("episode.persona.authorial is required");
  if (episode.platform !== "youtube") errors.push("episode.platform must be youtube");
  if (episode.publication_automation?.auto_public !== false) {
    errors.push("episode.publication_automation.auto_public must be false");
  }

  if (episode.source?.path_discrepancy?.reported !== true) {
    warnings.push("Source path discrepancy should be reported in episode.source.path_discrepancy");
  }

  const validation = validateSpokenAdaptation({ sourceText, spokenText });
  if (validation.warnings.length > 0) {
    warnings.push(...validation.warnings.map((warning) => `spoken validation: ${warning}`));
  }

  for (const requiredPhrase of episode.spoken_script?.must_preserve ?? []) {
    if (!spokenText.includes(requiredPhrase)) {
      errors.push(`Spoken draft is missing required preserved formulation: ${requiredPhrase}`);
    }
  }

  if (/^#{1,6}\s/m.test(spokenText) || /```/.test(spokenText)) {
    errors.push("Spoken draft still contains structural Markdown");
  }
  if (/https?:\/\/\S+/i.test(spokenText)) {
    errors.push("Spoken draft still contains a raw URL");
  }

  if (reviewTemplate.decision !== "approve") {
    errors.push("review.template.json must use decision=approve as the human approval template");
  }
  if (!reviewTemplate.reviewer) {
    errors.push("review.template.json must include a reviewer placeholder or name");
  }

  if (youtubeMetadata.visibility !== "private") {
    errors.push("youtube.metadata.json must default to visibility=private");
  }
  if (youtubeMetadata.madeForKids !== false) {
    errors.push("youtube.metadata.json must set madeForKids=false");
  }
  if (youtubeMetadata.language !== "fr") {
    errors.push("youtube.metadata.json must set language=fr for this reference episode");
  }
  if (!youtubeMetadata.syntheticVoiceDisclosure) {
    errors.push("syntheticVoiceDisclosure is required");
  } else if (/clonée|cloned voice|voix clon/i.test(youtubeMetadata.syntheticVoiceDisclosure)) {
    errors.push("syntheticVoiceDisclosure must not claim a cloned voice unless configured as such");
  }
  if (!youtubeMetadata.sourceUrl || !youtubeMetadata.canonicalUrl) {
    errors.push("youtube.metadata.json must include sourceUrl and canonicalUrl");
  }
  if (!/CC BY-SA/i.test(JSON.stringify(youtubeMetadata))) {
    errors.push("youtube.metadata.json must include CC BY-SA attribution");
  }

  const normalizedAudition = normalizeApostrophes(auditionText);
  const requiredAuditionPhrases = [
    "Jean Hugues Noël Robert",
    "Babbu Natale",
    "Gabriel et ses angelots",
    "autonomie de capacité",
    "Ubikia",
    "La magie est dans l’expérience ; la traçabilité est dans l’atelier.",
  ];
  for (const phrase of requiredAuditionPhrases) {
    if (!normalizedAudition.includes(normalizeApostrophes(phrase))) {
      errors.push(`pronunciation-audition.txt is missing phrase: ${phrase}`);
    }
  }

  return {
    status: errors.length === 0 ? "valid" : "invalid",
    project: absoluteDirectory,
    episode_slug: episode.slug ?? null,
    source_commit: episode.source?.commit ?? null,
    source_blob_sha: episode.source?.blob_sha ?? null,
    spoken_validation: validation,
    human_gates: episode.human_gates ?? null,
    errors,
    warnings,
  };
}

function normalizeApostrophes(value) {
  return String(value).replaceAll("'", "’");
}

async function readJson(filename) {
  return JSON.parse(await readFile(filename, "utf8"));
}
