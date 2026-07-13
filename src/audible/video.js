import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export async function createStaticYouTubeVideo({
  outputDirectory,
  imageFile,
  basename = null,
  ffmpegPath = process.env.FFMPEG_PATH ?? "ffmpeg",
  width = 1920,
  height = 1080,
  frameRate = 30,
  overwrite = true,
} = {}) {
  if (!outputDirectory) throw new Error("outputDirectory is required");
  if (!imageFile) throw new Error("imageFile is required");

  const absoluteDirectory = path.resolve(outputDirectory);
  const manifestPath = path.join(absoluteDirectory, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const audioProduct = selectAudioProduct(manifest);
  const audioFile = path.join(absoluteDirectory, audioProduct.filename);
  const absoluteImage = path.resolve(imageFile);
  const targetBasename = basename ?? path.basename(absoluteDirectory);
  const videoFile = path.join(absoluteDirectory, `${targetBasename}.youtube.mp4`);

  await ensureReadableFile(audioFile, "Audio product");
  await ensureReadableFile(absoluteImage, "Artwork image");
  await ensureExecutable(ffmpegPath);

  const scaleFilter = [
    `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
    `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
    "setsar=1",
  ].join(",");

  await run(ffmpegPath, [
    overwrite ? "-y" : "-n",
    "-hide_banner",
    "-loglevel", "warning",
    "-loop", "1",
    "-framerate", "1",
    "-i", absoluteImage,
    "-i", audioFile,
    "-vf", scaleFilter,
    "-r", String(frameRate),
    "-c:v", "libx264",
    "-tune", "stillimage",
    "-preset", "medium",
    "-crf", "18",
    "-c:a", "aac",
    "-b:a", "192k",
    "-pix_fmt", "yuv420p",
    "-shortest",
    "-movflags", "+faststart",
    videoFile,
  ]);

  const descriptor = await describeFile(videoFile, {
    kind: "youtube_video",
    format: "mp4",
    mime_type: "video/mp4",
    width,
    height,
    frame_rate: frameRate,
    source_audio: audioProduct.filename,
    source_artwork: absoluteImage,
  });

  const updatedManifest = {
    ...manifest,
    updated_at: new Date().toISOString(),
    publication_assets: {
      ...(manifest.publication_assets ?? {}),
      youtube_video: descriptor,
    },
  };

  await writeFile(manifestPath, `${JSON.stringify(updatedManifest, null, 2)}\n`, "utf8");
  return updatedManifest;
}

function selectAudioProduct(manifest) {
  const products = manifest.assembly?.products ?? [];
  for (const format of ["mp3", "opus", "wav"]) {
    const product = products.find((candidate) => candidate.format === format);
    if (product) return product;
  }
  throw new Error("No assembled audio product was found in manifest.json");
}

async function describeFile(filename, extra) {
  const fileStat = await stat(filename);
  const content = await readFile(filename);
  return {
    filename: path.basename(filename),
    bytes: fileStat.size,
    sha256: createHash("sha256").update(content).digest("hex"),
    ...extra,
  };
}

async function ensureReadableFile(filename, label) {
  try {
    const fileStat = await stat(filename);
    if (!fileStat.isFile() || fileStat.size === 0) {
      throw new Error(`${label} is empty or is not a regular file: ${filename}`);
    }
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`${label} was not found: ${filename}`);
    }
    throw error;
  }
}

async function ensureExecutable(command) {
  try {
    await run(command, ["-version"], { captureOutput: true });
  } catch (error) {
    throw new Error(`FFmpeg is unavailable. Install it or set FFMPEG_PATH. ${error.message}`);
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
