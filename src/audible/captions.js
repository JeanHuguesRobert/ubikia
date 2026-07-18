import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { prepareMarkdownForSpeech } from "./prepare-text.js";
import { segmentText } from "./segment-text.js";

/**
 * Build reviewable French SRT/VTT tracks when each manifest segment has a
 * reliable duration_seconds value. Returns null when timings are incomplete.
 */
export async function createCaptionTracksFromManifest({
  outputDirectory,
  speechText = null,
  maxCharacters = 900,
  language = "fr",
} = {}) {
  if (!outputDirectory) throw new Error("outputDirectory is required");

  const absoluteDirectory = path.resolve(outputDirectory);
  const manifestPath = path.join(absoluteDirectory, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const files = Array.isArray(manifest.files)
    ? [...manifest.files].sort((left, right) => left.sequence - right.sequence)
    : [];

  if (files.length === 0) {
    return {
      status: "unavailable",
      reason: "manifest declares no segments",
      captions: null,
    };
  }

  const missingDuration = files.filter(
    (entry) => !Number.isFinite(entry?.duration_seconds) || entry.duration_seconds <= 0,
  );
  if (missingDuration.length > 0) {
    return {
      status: "unavailable",
      reason: "segment duration_seconds is missing or unreliable; package the reviewed transcript for YouTube Studio instead",
      missing_segments: missingDuration.map((entry) => entry.filename),
      captions: null,
      follow_up: "Issue #2 / Media MVP: sentence-level timing and subtitle generation",
    };
  }

  const spoken = speechText
    ?? await readSpokenText(absoluteDirectory);
  const prepared = prepareMarkdownForSpeech(spoken);
  const segments = segmentText(prepared, {
    maxCharacters: manifest.max_characters ?? maxCharacters,
  });

  if (segments.length !== files.length) {
    return {
      status: "unavailable",
      reason: `segment text count (${segments.length}) does not match manifest files (${files.length})`,
      captions: null,
      follow_up: "Issue #2 / Media MVP: stable segment text retention for captions",
    };
  }

  const cues = [];
  let cursor = 0;
  for (const [index, entry] of files.entries()) {
    const start = cursor;
    const end = cursor + entry.duration_seconds;
    cues.push({
      index: index + 1,
      start,
      end,
      text: segments[index].replace(/\s+/g, " ").trim(),
    });
    cursor = end;
  }

  const srt = cues.map((cue) => [
    String(cue.index),
    `${formatSrtTimestamp(cue.start)} --> ${formatSrtTimestamp(cue.end)}`,
    cue.text,
    "",
  ].join("\n")).join("\n");

  const vtt = [
    "WEBVTT",
    `Language: ${language}`,
    "",
    ...cues.map((cue) => [
      String(cue.index),
      `${formatVttTimestamp(cue.start)} --> ${formatVttTimestamp(cue.end)}`,
      cue.text,
      "",
    ].join("\n")),
  ].join("\n");

  const srtFilename = "captions.fr.srt";
  const vttFilename = "captions.fr.vtt";
  await Promise.all([
    writeFile(path.join(absoluteDirectory, srtFilename), ensureFinalNewline(srt), "utf8"),
    writeFile(path.join(absoluteDirectory, vttFilename), ensureFinalNewline(vtt), "utf8"),
  ]);

  return {
    status: "generated",
    language,
    cue_count: cues.length,
    total_duration_seconds: cursor,
    captions: {
      srt: { filename: srtFilename, cue_count: cues.length },
      vtt: { filename: vttFilename, cue_count: cues.length },
    },
    method: "segment_duration_from_manifest",
    review_required: true,
    note: "Segment-level timings are approximate. Human review in YouTube Studio remains required before public use.",
  };
}

async function readSpokenText(directory) {
  for (const candidate of ["spoken.reviewed.md", "spoken.draft.md", "prepared.txt"]) {
    try {
      return await readFile(path.join(directory, candidate), "utf8");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  throw new Error("No spoken transcript found for caption generation");
}

function formatSrtTimestamp(seconds) {
  const { hours, minutes, secs, millis } = splitTime(seconds);
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)},${pad(millis, 3)}`;
}

function formatVttTimestamp(seconds) {
  const { hours, minutes, secs, millis } = splitTime(seconds);
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)}.${pad(millis, 3)}`;
}

function splitTime(seconds) {
  const totalMillis = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(totalMillis / 3_600_000);
  const minutes = Math.floor((totalMillis % 3_600_000) / 60_000);
  const secs = Math.floor((totalMillis % 60_000) / 1000);
  const millis = totalMillis % 1000;
  return { hours, minutes, secs, millis };
}

function pad(value, width) {
  return String(value).padStart(width, "0");
}

function ensureFinalNewline(value) {
  return value.endsWith("\n") ? value : `${value}\n`;
}
