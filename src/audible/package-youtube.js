import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createCaptionTracksFromManifest } from "./captions.js";

export async function createYouTubePublicationPackage({
  outputDirectory,
  metadata,
} = {}) {
  if (!outputDirectory) throw new Error("outputDirectory is required");
  if (!metadata || typeof metadata !== "object") {
    throw new TypeError("metadata must be an object");
  }
  if (!metadata.title) throw new Error("metadata.title is required");

  const absoluteDirectory = path.resolve(outputDirectory);
  const manifestPath = path.join(absoluteDirectory, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const video = manifest.publication_assets?.youtube_video;

  if (!video?.filename) {
    throw new Error("No YouTube video asset is recorded in manifest.json");
  }

  const transcript = await findTranscript(absoluteDirectory);
  if (!transcript) {
    throw new Error("No spoken transcript was found in the artifact directory");
  }

  const reviewOverride = transcript.review_status !== "reviewed"
    && metadata.allowUnreviewedTranscript === true;
  if (transcript.review_status !== "reviewed" && !reviewOverride) {
    throw new Error(
      "A reviewed spoken transcript is required. Create spoken.reviewed.md through the review step, or set allowUnreviewedTranscript=true for a visible development override.",
    );
  }

  const language = metadata.language ?? null;
  const disclosure = metadata.syntheticVoiceDisclosure
    ?? defaultSyntheticVoiceDisclosure(language);
  const description = buildDescription({
    ...metadata,
    disclosure,
  });

  const captions = metadata.skipCaptions === true
    ? {
        status: "skipped",
        reason: "metadata.skipCaptions=true",
        captions: null,
      }
    : await createCaptionTracksFromManifest({
      outputDirectory: absoluteDirectory,
      language: language ?? "fr",
    });

  const publicationPackage = {
    schema: "ubikia.youtube-publication-package.v0.1",
    created_at: new Date().toISOString(),
    status: "draft",
    human_review_required: true,
    upload_status: "not_uploaded",
    target: "youtube",
    title: metadata.title,
    description,
    language,
    series: metadata.series ?? null,
    author: metadata.author ?? null,
    source_url: metadata.sourceUrl ?? null,
    canonical_url: metadata.canonicalUrl ?? null,
    tags: normalizeTags(metadata.tags),
    category: metadata.category ?? null,
    visibility: metadata.visibility ?? "private",
    made_for_kids: metadata.madeForKids ?? false,
    altered_or_synthetic_content: metadata.alteredOrSyntheticContent ?? null,
    synthetic_voice_disclosure: disclosure,
    transcript,
    captions,
    development_override: reviewOverride
      ? {
          type: "allow_unreviewed_transcript",
          requested: true,
        }
      : null,
    video,
    provenance: {
      manifest: "manifest.json",
      source_reference: manifest.source_reference ?? null,
      adaptation_reference: manifest.adaptation_reference ?? null,
      source_sha256: manifest.source_sha256 ?? null,
      spoken_text_sha256: manifest.spoken_text_sha256 ?? null,
      audio_products: manifest.assembly?.products ?? [],
    },
    human_publication_gates: {
      spoken_script_review_required: true,
      assembled_audio_review_required: true,
      private_youtube_preview_before_public: true,
      automatic_public_publish: false,
    },
    publication_result: null,
  };

  await Promise.all([
    writeFile(
      path.join(absoluteDirectory, "youtube-package.json"),
      `${JSON.stringify(publicationPackage, null, 2)}\n`,
      "utf8",
    ),
    writeFile(path.join(absoluteDirectory, "youtube-title.txt"), `${metadata.title}\n`, "utf8"),
    writeFile(path.join(absoluteDirectory, "youtube-description.md"), `${description}\n`, "utf8"),
  ]);

  return publicationPackage;
}

function defaultSyntheticVoiceDisclosure(language) {
  if (language === "fr") {
    return "Cette vidéo utilise une voix de synthèse autorisée. Le texte, son adaptation orale et sa publication doivent être validés par l’éditeur responsable.";
  }
  return "This episode uses a synthetic voice authorized for this publication. The text, spoken adaptation, and publication remain human-validated.";
}

function buildDescription({
  summary = null,
  series = null,
  author = null,
  sourceUrl = null,
  canonicalUrl = null,
  disclosure,
  credits = null,
  links = [],
}) {
  const sections = [];

  if (summary) sections.push(summary.trim());
  if (series || author) {
    sections.push([
      series ? `Series: ${series}` : null,
      author ? `Author: ${author}` : null,
    ].filter(Boolean).join("\n"));
  }

  const references = [
    sourceUrl ? `Written source: ${sourceUrl}` : null,
    canonicalUrl ? `Canonical episode page: ${canonicalUrl}` : null,
    ...normalizeLinks(links),
  ].filter(Boolean);
  if (references.length > 0) sections.push(references.join("\n"));

  sections.push(`Synthetic voice disclosure: ${disclosure}`);
  if (credits) sections.push(credits.trim());
  return sections.join("\n\n");
}

async function findTranscript(directory) {
  const names = await readdir(directory);
  for (const candidate of [
    "spoken.reviewed.md",
    "spoken.draft.md",
    "prepared.txt",
  ]) {
    if (names.includes(candidate)) {
      return {
        filename: candidate,
        review_status: candidate === "spoken.reviewed.md" ? "reviewed" : "unreviewed",
      };
    }
  }
  return null;
}

function normalizeTags(tags) {
  if (!tags) return [];
  const values = Array.isArray(tags) ? tags : String(tags).split(",");
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}

function normalizeLinks(links) {
  if (!Array.isArray(links)) return [];
  return links
    .map((link) => {
      if (typeof link === "string") return link.trim();
      if (!link?.url) return null;
      return link.label ? `${link.label}: ${link.url}` : link.url;
    })
    .filter(Boolean);
}
