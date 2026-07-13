import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { prepareMarkdownForSpeech } from "./prepare-text.js";
import { segmentText } from "./segment-text.js";
import { normalizeWavBuffer } from "./wav.js";

export async function renderAudibleProduct({
  sourceText,
  speechText = sourceText,
  sourceReference = null,
  adaptationReference = null,
  outputDirectory,
  provider,
  maxCharacters = 900,
}) {
  if (typeof sourceText !== "string" || sourceText.trim() === "") {
    throw new TypeError("sourceText must be a non-empty string");
  }
  if (typeof speechText !== "string" || speechText.trim() === "") {
    throw new TypeError("speechText must be a non-empty string");
  }
  if (!provider || typeof provider.synthesize !== "function") {
    throw new TypeError("A TTS provider with synthesize(text) is required");
  }
  if (!outputDirectory) {
    throw new Error("outputDirectory is required");
  }

  const preparedText = prepareMarkdownForSpeech(speechText);
  const segments = segmentText(preparedText, { maxCharacters });
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, "prepared.txt"), `${preparedText}\n`, "utf8");

  const existingManifest = await readJsonIfPresent(path.join(outputDirectory, "manifest.json"));
  const compatibleExistingRun = existingManifest
    && existingManifest.voice_id === (provider.voiceId ?? null)
    && existingManifest.output_format === (provider.outputFormat ?? "wav");
  const existingFiles = new Map(
    (compatibleExistingRun ? existingManifest.files ?? [] : [])
      .map((file) => [file.filename, file]),
  );

  const files = [];
  for (const [index, segment] of segments.entries()) {
    const sequenceNumber = index + 1;
    const sequence = String(sequenceNumber).padStart(3, "0");
    const outputFormat = provider.outputFormat ?? "wav";
    const filename = `segment-${sequence}.${outputFormat}`;
    const destination = path.join(outputDirectory, filename);
    const textSha256 = sha256(Buffer.from(segment, "utf8"));
    const existingEntry = existingFiles.get(filename);

    let providerAudio;
    let reused = false;
    if (
      existingEntry?.text_sha256 === textSha256
      && await isNonEmptyFile(destination)
    ) {
      providerAudio = await readFile(destination);
      reused = true;
      console.log(`Reuse ${filename}`);
    } else {
      console.log(`Render ${filename} (${segment.length} characters)`);
      providerAudio = await provider.synthesize(segment);
    }

    const providerResponseSha256 = existingEntry?.provider_response_sha256
      ?? existingEntry?.sha256
      ?? sha256(providerAudio);
    const normalization = normalizeProviderAudio(providerAudio, outputFormat);
    const audio = normalization.buffer;

    if (!reused || normalization.changed) {
      await writeFile(destination, audio);
    }

    files.push({
      sequence: sequenceNumber,
      filename,
      characters: segment.length,
      text_sha256: textSha256,
      provider_response_sha256: providerResponseSha256,
      sha256: sha256(audio),
      reused,
      container_normalization: {
        recognized: normalization.recognized,
        applied: normalization.changed,
        repairs: normalization.repairs,
      },
    });

    await writeManifest(outputDirectory, buildManifest({
      sourceText,
      speechText,
      preparedText,
      sourceReference,
      adaptationReference,
      provider,
      files,
      expectedSegmentCount: segments.length,
      status: "rendering",
    }));
  }

  const manifest = buildManifest({
    sourceText,
    speechText,
    preparedText,
    sourceReference,
    adaptationReference,
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
  speechText,
  preparedText,
  sourceReference,
  adaptationReference,
  provider,
  files,
  expectedSegmentCount,
  status,
}) {
  return {
    schema: "ubikia.audible-manifest.v0.4",
    updated_at: new Date().toISOString(),
    status,
    source_reference: sourceReference,
    adaptation_reference: adaptationReference,
    source_sha256: sha256(Buffer.from(sourceText, "utf8")),
    spoken_text_sha256: sha256(Buffer.from(speechText, "utf8")),
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

function normalizeProviderAudio(audio, outputFormat) {
  if (outputFormat.toLowerCase() !== "wav") {
    return {
      buffer: audio,
      recognized: false,
      changed: false,
      repairs: [],
    };
  }

  const result = normalizeWavBuffer(audio);
  if (!result.recognized) {
    throw new Error("The provider declared WAV output but returned an invalid RIFF/WAVE payload");
  }
  return result;
}

async function writeManifest(outputDirectory, manifest) {
  await writeFile(
    path.join(outputDirectory, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

async function readJsonIfPresent(filename) {
  try {
    return JSON.parse(await readFile(filename, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT" || error instanceof SyntaxError) return null;
    throw error;
  }
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
