import { createHash } from "node:crypto";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { validateSpokenAdaptation } from "./adapt.js";

export async function reviewSpokenAdaptation({
  outputDirectory,
  review,
} = {}) {
  if (!outputDirectory) throw new Error("outputDirectory is required");
  if (!review || typeof review !== "object") {
    throw new TypeError("review must be an object");
  }
  if (review.decision !== "approve") {
    throw new Error("Only an explicit decision of 'approve' creates spoken.reviewed.md");
  }
  if (!review.reviewer || typeof review.reviewer !== "string") {
    throw new Error("review.reviewer is required");
  }

  const absoluteDirectory = path.resolve(outputDirectory);
  const adaptationPath = path.join(absoluteDirectory, "adaptation.json");
  const sourcePath = path.join(absoluteDirectory, "source.md");
  const draftPath = path.join(absoluteDirectory, "spoken.draft.md");
  const reviewedPath = path.join(absoluteDirectory, "spoken.reviewed.md");
  const reviewPath = path.join(absoluteDirectory, "review.json");

  const [adaptation, sourceText, draftText] = await Promise.all([
    readJson(adaptationPath),
    readFile(sourcePath, "utf8"),
    readFile(draftPath, "utf8"),
  ]);

  const validation = validateSpokenAdaptation({
    sourceText,
    spokenText: draftText,
  });

  if (
    validation.warnings.length > 0
    && review.acknowledgeWarnings !== true
  ) {
    throw new Error(
      "Mechanical validation warnings remain. Set acknowledgeWarnings to true after reviewing them.",
    );
  }

  const reviewedAt = new Date().toISOString();
  const reviewedSha256 = sha256(draftText);
  const reviewRecord = {
    schema: "ubikia.spoken-review.v0.1",
    decision: "approve",
    reviewer: review.reviewer,
    reviewed_at: reviewedAt,
    notes: review.notes ?? null,
    acknowledge_warnings: review.acknowledgeWarnings === true,
    validation,
    source_sha256: sha256(sourceText),
    draft_sha256: sha256(draftText),
    reviewed_sha256: reviewedSha256,
  };

  await copyFile(draftPath, reviewedPath);

  const updatedAdaptation = {
    ...adaptation,
    updated_at: reviewedAt,
    status: "reviewed",
    spoken_product: {
      ...(adaptation.spoken_product ?? {}),
      filename: "spoken.reviewed.md",
      sha256: reviewedSha256,
      reviewed: true,
      review_record: "review.json",
    },
    validation,
    review: {
      filename: "review.json",
      reviewer: review.reviewer,
      reviewed_at: reviewedAt,
      decision: "approve",
    },
  };

  await Promise.all([
    writeFile(reviewPath, `${JSON.stringify(reviewRecord, null, 2)}\n`, "utf8"),
    writeFile(adaptationPath, `${JSON.stringify(updatedAdaptation, null, 2)}\n`, "utf8"),
  ]);

  return {
    adaptation: updatedAdaptation,
    review: reviewRecord,
  };
}

async function readJson(filename) {
  return JSON.parse(await readFile(filename, "utf8"));
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
