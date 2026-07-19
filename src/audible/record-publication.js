import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  publicationEntryFromYouTubeRecord,
  upsertPublicationLedgerEntry,
} from "./publication-ledger.js";

export async function recordYouTubePublication({
  outputDirectory,
  url,
  visibility = "public",
  recordedBy = null,
  publishedAt = null,
  updateLedger = true,
  ledgerPath = null,
  slug = null,
  source = null,
  notes = null,
} = {}) {
  if (!outputDirectory) throw new Error("outputDirectory is required");
  if (!url) throw new Error("url is required");

  const absoluteDirectory = path.resolve(outputDirectory);
  const manifestPath = path.join(absoluteDirectory, "manifest.json");
  const packagePath = path.join(absoluteDirectory, "youtube-package.json");
  const publicationPath = path.join(absoluteDirectory, "publication.youtube.json");

  const [manifest, publicationPackage, existingPublication] = await Promise.all([
    readJson(manifestPath),
    readJson(packagePath),
    readJsonIfPresent(publicationPath),
  ]);

  if (publicationPackage.target !== "youtube") {
    throw new Error("youtube-package.json does not target YouTube");
  }
  if (!publicationPackage.video?.filename) {
    throw new Error("youtube-package.json does not identify the published video asset");
  }
  if (publicationPackage.transcript?.review_status !== "reviewed") {
    throw new Error("A reviewed transcript is required before recording a publication");
  }

  const videoId = extractYouTubeVideoId(url);
  if (
    existingPublication
    && existingPublication.video_id
    && existingPublication.video_id !== videoId
  ) {
    throw new Error(
      `A different YouTube publication is already recorded: ${existingPublication.video_id}`,
    );
  }

  const now = new Date().toISOString();
  const effectivePublishedAt = normalizeDate(
    publishedAt ?? existingPublication?.published_at ?? now,
    "publishedAt",
  );

  const publication = {
    schema: "ubikia.youtube-publication-result.v0.1",
    platform: "youtube",
    status: "published",
    url,
    canonical_url: `https://www.youtube.com/watch?v=${videoId}`,
    video_id: videoId,
    visibility,
    published_at: effectivePublishedAt,
    recorded_at: now,
    recorded_by: recordedBy,
    evidence: {
      type: "human_confirmation",
      remote_verification: "not_performed",
    },
    title: publicationPackage.title,
    video: publicationPackage.video,
    transcript: publicationPackage.transcript,
    provenance: publicationPackage.provenance,
  };

  const updatedPackage = {
    ...publicationPackage,
    status: "published",
    upload_status: "published",
    visibility,
    publication_result: {
      filename: "publication.youtube.json",
      platform: "youtube",
      status: "published",
      url,
      video_id: videoId,
      published_at: effectivePublishedAt,
      recorded_at: now,
      recorded_by: recordedBy,
    },
  };

  const updatedManifest = {
    ...manifest,
    updated_at: now,
    publication_status: "published",
    publication_assets: {
      ...(manifest.publication_assets ?? {}),
      youtube_publication: {
        filename: "publication.youtube.json",
        status: "published",
        url,
        video_id: videoId,
        visibility,
        published_at: effectivePublishedAt,
      },
    },
  };

  await Promise.all([
    writeJson(publicationPath, publication),
    writeJson(packagePath, updatedPackage),
    writeJson(manifestPath, updatedManifest),
  ]);

  let ledger = null;
  if (updateLedger !== false) {
    const inferredSlug = slug
      ?? path.basename(absoluteDirectory);
    ledger = await upsertPublicationLedgerEntry(
      publicationEntryFromYouTubeRecord(publication, {
        slug: inferredSlug,
        source,
        notes,
      }),
      ledgerPath ? { ledgerPath } : {},
    );
  }

  return {
    ...publication,
    ledger,
  };
}

export function extractYouTubeVideoId(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Invalid YouTube URL: ${value}`);
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
  let videoId = null;

  if (hostname === "youtu.be") {
    videoId = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (hostname === "youtube.com" || hostname === "m.youtube.com") {
    if (parsed.pathname === "/watch") videoId = parsed.searchParams.get("v");
    else {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (["shorts", "live", "embed"].includes(parts[0])) videoId = parts[1] ?? null;
    }
  }

  if (!videoId || !/^[A-Za-z0-9_-]{6,}$/.test(videoId)) {
    throw new Error(`Unsupported or incomplete YouTube URL: ${value}`);
  }
  return videoId;
}

async function readJson(filename) {
  return JSON.parse(await readFile(filename, "utf8"));
}

async function readJsonIfPresent(filename) {
  try {
    return await readJson(filename);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function writeJson(filename, value) {
  await writeFile(filename, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function normalizeDate(value, label) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} is not a valid date: ${value}`);
  return date.toISOString();
}
