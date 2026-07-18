import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createSpokenAdaptationWorkspace, validateSpokenAdaptation } from "./adapt.js";
import {
  detectFinalizePathAliasing,
  requireStagedFinalizeInputs,
} from "./path-safety.js";
import { reviewSpokenAdaptation } from "./review.js";

/**
 * Prepare a finalize workspace without TTS.
 *
 * Always stages the approved spoken text from memory after the workspace is
 * created, so an approved/adapted input that lives inside the output directory
 * cannot be overwritten by the mechanical draft and then lost.
 */
export async function prepareFinalizedAdaptationWorkspace({
  sourceText,
  spokenText,
  sourceFile = null,
  spokenFile = null,
  outputDirectory,
  reviewer,
  metadata = {},
  notes = "Approved for governed audio rendering.",
  acknowledgeWarnings = false,
} = {}) {
  if (typeof sourceText !== "string" || sourceText.trim() === "") {
    throw new TypeError("sourceText must be a non-empty string");
  }
  if (typeof spokenText !== "string" || spokenText.trim() === "") {
    throw new TypeError("spokenText must be a non-empty string");
  }
  if (!outputDirectory) throw new Error("outputDirectory is required");
  if (!reviewer || typeof reviewer !== "string") {
    throw new Error("reviewer is required");
  }

  const absoluteOutput = path.resolve(outputDirectory);
  const aliasing = detectFinalizePathAliasing({
    sourceFile: sourceFile ?? path.join(absoluteOutput, "__external_source__.md"),
    spokenFile: spokenFile ?? path.join(absoluteOutput, "__external_spoken__.md"),
    outputDirectory: absoluteOutput,
  });
  const staging = requireStagedFinalizeInputs(aliasing);

  const validation = validateSpokenAdaptation({ sourceText, spokenText });
  if (validation.warnings.length > 0 && acknowledgeWarnings !== true) {
    const error = new Error(
      "Mechanical validation warnings remain. Review them, then rerun with acknowledgeWarnings=true.",
    );
    error.validation = validation;
    throw error;
  }

  await createSpokenAdaptationWorkspace({
    sourceText,
    outputDirectory: absoluteOutput,
    metadata: {
      sourceReference: sourceFile ?? metadata.sourceReference ?? null,
      sourceUrl: metadata.sourceUrl ?? null,
      title: metadata.title ?? null,
      series: metadata.series ?? null,
      author: metadata.author ?? reviewer,
      language: metadata.language ?? "fr",
      audience: metadata.audience ?? "general public",
    },
  });

  // Always re-write both inputs from the in-memory buffers captured before
  // workspace creation. This is the safe staging behavior for aliased paths.
  const sourcePath = path.join(absoluteOutput, "source.md");
  const draftPath = path.join(absoluteOutput, "spoken.draft.md");
  await Promise.all([
    writeFile(sourcePath, ensureFinalNewline(sourceText), "utf8"),
    writeFile(draftPath, ensureFinalNewline(spokenText), "utf8"),
  ]);

  const adaptationPath = path.join(absoluteOutput, "adaptation.json");
  const adaptation = JSON.parse(await readFile(adaptationPath, "utf8"));
  adaptation.updated_at = new Date().toISOString();
  adaptation.status = "draft_unreviewed";
  adaptation.path_aliasing = {
    ...aliasing,
    staging,
  };
  adaptation.spoken_product = {
    ...(adaptation.spoken_product ?? {}),
    filename: "spoken.draft.md",
    sha256: sha256(spokenText),
    adaptation_method: "governed_human_or_agent_adaptation",
    human_review_required: true,
    reviewed: false,
  };
  adaptation.validation = validation;
  await writeFile(adaptationPath, `${JSON.stringify(adaptation, null, 2)}\n`, "utf8");

  const review = await reviewSpokenAdaptation({
    outputDirectory: absoluteOutput,
    review: {
      decision: "approve",
      reviewer,
      notes,
      acknowledgeWarnings: acknowledgeWarnings === true,
    },
  });

  return {
    outputDirectory: absoluteOutput,
    aliasing,
    staging,
    validation,
    review,
    reviewedFile: path.join(absoluteOutput, "spoken.reviewed.md"),
    sourceFile: sourcePath,
    spokenDraftFile: draftPath,
  };
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function ensureFinalNewline(value) {
  return value.endsWith("\n") ? value : `${value}\n`;
}
