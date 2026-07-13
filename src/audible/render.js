import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { prepareMarkdownForSpeech } from "./prepare-text.js";
import { segmentText } from "./segment-text.js";

export async function renderAudibleProduct({
  sourceText,
  sourceReference = null,
  outputDirectory,
  provider,
  maxCharacters = 900,
}) {
  if (!provider || typeof provider.synthesize !== "function") {
    throw new TypeError("A TTS provider with synthesize(text) is required");
  }
  if (!outputDirectory) {
    throw new Error("outputDirectory is required");
  }

  const preparedText = prepareMarkdownForSpeech(sourceText);
  const segments = segmentText(preparedText, { maxCharacters });
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, "prepared.txt"), `${preparedText}\n`, "utf8");

  const files = [];
  for (const [index, segment] of segments.entries()) {
    const sequenceNumber = index + 1;
    const sequence = String(sequenceNumber).padStart(3, "0");
    const filename = `segment-${sequence}.${provider.outputFormat ?? "wav"}`;
    const destination = path.join(outputDirectory, filename);

    let audio;
    let reused = false;
    if (await isNonEmptyFile(destination)) {
      audio = await readFile(destination);
      reused = true;
      console.log(`Reuse ${filename}`);
    } else {
      console.log(`Render ${filename} (${segment.length} characters)`);
      audio = await provider.synthesize(segment);
      await writeFile(destination, audio);
    }

    files.push({
      sequence: sequenceNumber,
      filename,
      characters: segment.length,
      sha256: sha256(audio),
      reused,
    });

    await writeManifest(outputDirectory, buildManifest({
      sourceText,
      preparedText,
      sourceReference,
      provider,
      files,
      expectedSegmentCount: segments.length,
      status: "rendering",
    }));
  }

  const manifest = buildManifest({
    sourceText,
    preparedText,
    sourceReference,
    provider,
    files,
    expectedSegmentCount: segments.length,
    status: "complete",
  });
  await writeManifest(outputDirectory, manifest);
  return manifest;
}

function buildManifest({
  sourceText,
  preparedText,
  sourceReference,
  provider,
  files,
  expectedSegmentCount,
  status,
}) {
  return {
    schema: "ubikia.audible-manifest.v0.2",
    updated_at: new Date().toISOString(),
    status,
    source_reference: sourceReference,
    source_sha256: sha256(Buffer.from(sourceText, "utf8")),
    prepared_text_sha256: sha256(Buffer.from(preparedText, "utf8")),
    provider: provider.constructor.name,
    voice_id: provider.voiceId ?? null,
    output_format: provider.outputFormat ?? "wav",
    expected_segment_count: expectedSegmentCount,
    completed_segment_count: files.length,
    segment_count: files.length,
    files,
    assembly_status: "not_assembled",
    provenance_preserved: true,
  };
}

async function writeManifest(outputDirectory, manifest) {
  await writeFile(
    path.join(outputDirectory, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

async function isNonEmptyFile(filename) {
  try {
    return (await stat(filename)).size > 0;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}
