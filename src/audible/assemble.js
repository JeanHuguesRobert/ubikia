import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { normalizeWavBuffer } from "./wav.js";

export async function assembleAudibleProduct({
  outputDirectory,
  basename = "audible-product",
  ffmpegPath = process.env.FFMPEG_PATH ?? "ffmpeg",
  ffprobePath = process.env.FFPROBE_PATH ?? "ffprobe",
  formats = ["mp3", "opus"],
  overwrite = true,
} = {}) {
  if (!outputDirectory) throw new Error("outputDirectory is required");

  const absoluteDirectory = path.resolve(outputDirectory);
  const manifestPath = path.join(absoluteDirectory, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const segmentFiles = await resolveManifestSegments(absoluteDirectory, manifest);

  await ensureExecutable(ffmpegPath, ["-version"], "FFmpeg");

  const normalization = await normalizeSegmentContainers(segmentFiles, manifest);
  const normalizedManifest = {
    ...manifest,
    files: normalization.files,
  };

  const concatFile = path.join(absoluteDirectory, "segments.ffconcat");
  await writeFile(concatFile, buildConcatFile(segmentFiles), "utf8");

  const assembledWav = path.join(absoluteDirectory, `${basename}.wav`);
  await run(ffmpegPath, [
    overwrite ? "-y" : "-n",
    "-hide_banner",
    "-loglevel", "warning",
    "-f", "concat",
    "-safe", "0",
    "-i", concatFile,
    "-c:a", "pcm_s16le",
    assembledWav,
  ]);

  const products = [await describeAudioFile(assembledWav, ffprobePath, "wav")];

  if (formats.includes("mp3")) {
    const mp3 = path.join(absoluteDirectory, `${basename}.mp3`);
    await run(ffmpegPath, [
      overwrite ? "-y" : "-n",
      "-hide_banner",
      "-loglevel", "warning",
      "-i", assembledWav,
      "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
      "-codec:a", "libmp3lame",
      "-b:a", "128k",
      mp3,
    ]);
    products.push(await describeAudioFile(mp3, ffprobePath, "mp3"));
  }

  if (formats.includes("opus")) {
    const opus = path.join(absoluteDirectory, `${basename}.opus`);
    await run(ffmpegPath, [
      overwrite ? "-y" : "-n",
      "-hide_banner",
      "-loglevel", "warning",
      "-i", assembledWav,
      "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
      "-codec:a", "libopus",
      "-b:a", "64k",
      opus,
    ]);
    products.push(await describeAudioFile(opus, ffprobePath, "opus"));
  }

  const updatedManifest = {
    ...normalizedManifest,
    updated_at: new Date().toISOString(),
    assembly_status: "complete",
    assembly: {
      ffmpeg_path: ffmpegPath,
      concat_file: path.basename(concatFile),
      segment_source: "manifest.files",
      segment_count: segmentFiles.length,
      input_container_normalization: {
        method: "repair-riff-and-data-chunk-sizes",
        repaired_segment_count: normalization.repairedSegments.length,
        repaired_segments: normalization.repairedSegments,
      },
      assembled_wav_codec: "pcm_s16le",
      loudness_target: {
        integrated_lufs: -16,
        true_peak_db: -1.5,
        loudness_range_lu: 11,
      },
      products,
    },
  };

  await writeFile(manifestPath, `${JSON.stringify(updatedManifest, null, 2)}\n`, "utf8");
  return updatedManifest;
}

async function normalizeSegmentContainers(segmentFiles, manifest) {
  if ((manifest.output_format ?? "wav").toLowerCase() !== "wav") {
    return {
      files: manifest.files,
      repairedSegments: [],
    };
  }

  const entriesByFilename = new Map(
    (manifest.files ?? []).map((entry) => [entry.filename, { ...entry }]),
  );
  const repairedSegments = [];

  for (const filename of segmentFiles) {
    const basename = path.basename(filename);
    const entry = entriesByFilename.get(basename);
    const before = await readFile(filename);
    const beforeSha256 = sha256(before);
    const result = normalizeWavBuffer(before);

    if (!result.recognized) {
      throw new Error(`Manifest declares WAV output but ${basename} is not a RIFF/WAVE file`);
    }

    if (result.changed) {
      await writeFile(filename, result.buffer);
      repairedSegments.push(basename);
    }

    const previousNormalization = entry?.container_normalization;
    entriesByFilename.set(basename, {
      ...entry,
      filename: basename,
      provider_response_sha256: entry?.provider_response_sha256
        ?? entry?.sha256
        ?? beforeSha256,
      sha256: sha256(result.buffer),
      container_normalization: {
        recognized: true,
        applied: result.changed || previousNormalization?.applied === true,
        repairs: result.changed
          ? result.repairs
          : previousNormalization?.repairs ?? [],
      },
    });
  }

  return {
    files: (manifest.files ?? []).map((entry) => entriesByFilename.get(entry.filename)),
    repairedSegments,
  };
}

async function resolveManifestSegments(directory, manifest) {
  const entries = Array.isArray(manifest.files)
    ? [...manifest.files].sort((left, right) => left.sequence - right.sequence)
    : [];

  if (entries.length === 0) {
    throw new Error("manifest.json does not declare any rendered audio segments");
  }
  if (
    Number.isInteger(manifest.expected_segment_count)
    && entries.length !== manifest.expected_segment_count
  ) {
    throw new Error(
      `Rendering is incomplete: manifest declares ${entries.length} of ${manifest.expected_segment_count} segments`,
    );
  }

  const files = [];
  for (const entry of entries) {
    if (!entry?.filename) {
      throw new Error("A manifest segment entry has no filename");
    }
    const filename = path.join(directory, entry.filename);
    const fileStat = await stat(filename);
    if (!fileStat.isFile() || fileStat.size === 0) {
      throw new Error(`Rendered segment is empty or invalid: ${filename}`);
    }
    files.push(filename);
  }
  return files;
}

function buildConcatFile(files) {
  const lines = ["ffconcat version 1.0"];
  for (const filename of files) {
    const normalized = filename.replaceAll("\\", "/").replaceAll("'", "'\\''");
    lines.push(`file '${normalized}'`);
  }
  return `${lines.join("\n")}\n`;
}

async function describeAudioFile(filename, ffprobePath, format) {
  const fileStat = await stat(filename);
  let durationSeconds = null;

  try {
    const output = await run(ffprobePath, [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filename,
    ], { captureOutput: true });
    const parsed = Number.parseFloat(output.stdout.trim());
    if (Number.isFinite(parsed)) durationSeconds = parsed;
  } catch {
    // The audio remains usable if ffprobe is unavailable; duration stays unknown.
  }

  const content = await readFile(filename);
  return {
    filename: path.basename(filename),
    format,
    bytes: fileStat.size,
    duration_seconds: durationSeconds,
    sha256: sha256(content),
  };
}

async function ensureExecutable(command, args, label) {
  try {
    await run(command, args, { captureOutput: true });
  } catch (error) {
    throw new Error(`${label} is unavailable. Install it or set ${label.toUpperCase()}_PATH. ${error.message}`);
  }
}

function run(command, args, { captureOutput = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      stdio: captureOutput ? ["ignore", "pipe", "pipe"] : "inherit",
    });

    let stdout = "";
    let stderr = "";
    if (captureOutput) {
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
    }

    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} exited with code ${code}${stderr ? `: ${stderr.trim()}` : ""}`));
    });
  });
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}
