import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

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
  const segmentFiles = await findOrderedSegments(absoluteDirectory, manifest.output_format ?? "wav");

  if (segmentFiles.length === 0) {
    throw new Error(`No audio segments found in ${absoluteDirectory}`);
  }

  await ensureExecutable(ffmpegPath, ["-version"], "FFmpeg");

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
    "-c", "copy",
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
    ...manifest,
    updated_at: new Date().toISOString(),
    assembly_status: "complete",
    assembly: {
      ffmpeg_path: ffmpegPath,
      concat_file: path.basename(concatFile),
      segment_count: segmentFiles.length,
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

async function findOrderedSegments(directory, extension) {
  const names = await readdir(directory);
  return names
    .filter((name) => new RegExp(`^segment-\\d+\\.${escapeRegExp(extension)}$`, "i").test(name))
    .sort((left, right) => left.localeCompare(right, "en", { numeric: true }))
    .map((name) => path.join(directory, name));
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
    sha256: createHash("sha256").update(content).digest("hex"),
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
