import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { prepareMarkdownForSpeech } from "./prepare-text.js";
import { segmentText } from "./segment-text.js";

export async function renderAudibleProduct({
  sourceText,
  sourceReference = null,
  outputDirectory,
  provider,
  maxCharacters = 2200,
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

  const files = [];
  for (const [index, segment] of segments.entries()) {
    const sequence = String(index + 1).padStart(3, "0");
    const filename = `segment-${sequence}.${provider.outputFormat ?? "wav"}`;
    const destination = path.join(outputDirectory, filename);
    const audio = await provider.synthesize(segment);
    await writeFile(destination, audio);
    files.push({
      sequence: index + 1,
      filename,
      characters: segment.length,
      sha256: sha256(audio),
    });
  }

  const manifest = {
    schema: "ubikia.audible-manifest.v0.1",
    created_at: new Date().toISOString(),
    source_reference: sourceReference,
    source_sha256: sha256(Buffer.from(sourceText, "utf8")),
    prepared_text_sha256: sha256(Buffer.from(preparedText, "utf8")),
    provider: provider.constructor.name,
    voice_id: provider.voiceId ?? null,
    output_format: provider.outputFormat ?? "wav",
    segment_count: files.length,
    files,
    assembly_status: "not_assembled",
    provenance_preserved: true,
  };

  await writeFile(
    path.join(outputDirectory, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  await writeFile(path.join(outputDirectory, "prepared.txt"), `${preparedText}\n`, "utf8");

  return manifest;
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}
