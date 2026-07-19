import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { prepareMarkdownForSpeech } from "./prepare-text.js";
import { isProviderCapacityError } from "./providers/retry.js";
import { publicSynthesisIdentity } from "./providers/synthesis-identity.js";
import { segmentText } from "./segment-text.js";
import { normalizeWavBuffer, wavHasPcmSamples } from "./wav.js";

export const AUDIBLE_MANIFEST_SCHEMA = "ubikia.audible-manifest.v0.5";

/**
 * Render spoken text to segment audio files with provider-aware resume.
 *
 * Modes:
 * - default completion: reuse any valid segment with matching text_sha256
 *   (including segments produced by another provider) so a partial job can be
 *   finished when quota/capacity forces a provider change;
 * - forceRerender: ignore existing segments and regenerate with the active
 *   provider (use when mixed quality is unacceptable).
 *
 * Optional providerChain: on capacity errors (402/429/quota), switch to the
 * next fallback for remaining segments only — not quality ranking.
 */
export async function renderAudibleProduct({
  sourceText,
  speechText = sourceText,
  sourceReference = null,
  adaptationReference = null,
  outputDirectory,
  provider,
  providerChain = null,
  maxCharacters = 900,
  forceRerender = false,
} = {}) {
  if (typeof sourceText !== "string" || sourceText.trim() === "") {
    throw new TypeError("sourceText must be a non-empty string");
  }
  if (typeof speechText !== "string" || speechText.trim() === "") {
    throw new TypeError("speechText must be a non-empty string");
  }
  if (!outputDirectory) {
    throw new Error("outputDirectory is required");
  }

  const chain = normalizeProviderChain(provider, providerChain);
  let activeIndex = 0;
  let active = chain[activeIndex];

  const preparedText = prepareMarkdownForSpeech(speechText);
  const segments = segmentText(preparedText, { maxCharacters });
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, "prepared.txt"), `${preparedText}\n`, "utf8");

  const existingManifest = await readJsonIfPresent(path.join(outputDirectory, "manifest.json"));
  const existingFiles = new Map(
    (existingManifest?.files ?? []).map((file) => [file.filename, file]),
  );

  const files = [];
  const providerSwitches = [];

  for (const [index, segment] of segments.entries()) {
    const sequenceNumber = index + 1;
    const sequence = String(sequenceNumber).padStart(3, "0");
    const outputFormat = active.provider.outputFormat ?? "wav";
    const filename = `segment-${sequence}.${outputFormat}`;
    const destination = path.join(outputDirectory, filename);
    const textSha256 = sha256(Buffer.from(segment, "utf8"));
    const existingEntry = existingFiles.get(filename);
    const activeIdentity = active.provider.getSynthesisIdentity();

    let providerAudio;
    let reused = false;
    let segmentIdentity = activeIdentity;
    let segmentProviderId = active.provider.id;

    const canReuse = !forceRerender
      && existingEntry?.text_sha256 === textSha256
      && await isReusableSegmentFile(destination, outputFormat);

    if (canReuse) {
      providerAudio = await readFile(destination);
      reused = true;
      // Never attribute a reused segment to the active provider unless the
      // previous entry actually recorded that provider. Legacy manifests may
      // only have text hashes; mark them unknown rather than rewriting history.
      segmentProviderId = existingEntry.provider_id
        ?? existingEntry.synthesis?.provider_id
        ?? "unknown_legacy";
      segmentIdentity = existingEntry.synthesis
        ?? {
          provider_id: segmentProviderId,
          model: null,
          api_version: null,
          voice_id: existingEntry.voice_id ?? null,
          language: null,
          output: {
            container: outputFormat,
            encoding: null,
            sample_rate: null,
            codec: null,
          },
          settings: null,
          seed: null,
          synthesis_identity_sha256: existingEntry.synthesis_identity_sha256
            ?? `legacy:${existingEntry.text_sha256 ?? textSha256}`,
          legacy_reuse: true,
        };
      console.log(`Reuse ${filename} (provider=${segmentProviderId})`);
    } else {
      const synthesized = await synthesizeWithCapacityFallback({
        chain,
        startIndex: activeIndex,
        text: segment,
        filename,
      });
      if (synthesized.switchedFrom != null) {
        providerSwitches.push({
          at_segment: sequenceNumber,
          from: synthesized.switchedFrom,
          to: synthesized.provider.id,
          reason: "provider_capacity",
        });
        activeIndex = synthesized.chainIndex;
        active = chain[activeIndex];
      }
      providerAudio = synthesized.audio;
      segmentIdentity = synthesized.provider.getSynthesisIdentity();
      segmentProviderId = synthesized.provider.id;
      console.log(
        `Render ${filename} (${segment.length} characters, provider=${segmentProviderId})`,
      );
    }

    const providerResponseSha256 = reused
      ? (existingEntry?.provider_response_sha256 ?? existingEntry?.sha256 ?? sha256(providerAudio))
      : sha256(providerAudio);
    const normalization = normalizeProviderAudio(providerAudio, outputFormat);
    const audio = normalization.buffer;
    assertRenderableAudio(audio, outputFormat, filename);
    const previousNormalization = existingEntry?.container_normalization;

    if (!reused || normalization.changed) {
      await writeFile(destination, audio);
    }

    files.push({
      sequence: sequenceNumber,
      filename,
      characters: segment.length,
      text_sha256: textSha256,
      provider_id: segmentProviderId,
      synthesis: publicSynthesisIdentity(segmentIdentity),
      synthesis_identity_sha256: segmentIdentity.synthesis_identity_sha256,
      provider_response_sha256: providerResponseSha256,
      sha256: sha256(audio),
      reused,
      container_normalization: {
        recognized: normalization.recognized,
        applied: normalization.changed || previousNormalization?.applied === true,
        repairs: normalization.changed
          ? normalization.repairs
          : previousNormalization?.repairs ?? [],
      },
    });

    await writeManifest(outputDirectory, buildManifest({
      sourceText,
      speechText,
      preparedText,
      sourceReference,
      adaptationReference,
      activeProvider: active.provider,
      files,
      expectedSegmentCount: segments.length,
      status: "rendering",
      forceRerender,
      providerSwitches,
      maxCharacters,
    }));
  }

  const manifest = buildManifest({
    sourceText,
    speechText,
    preparedText,
    sourceReference,
    adaptationReference,
    activeProvider: active.provider,
    files,
    expectedSegmentCount: segments.length,
    status: "complete",
    forceRerender,
    providerSwitches,
    maxCharacters,
  });
  await writeManifest(outputDirectory, manifest);
  return manifest;
}

function normalizeProviderChain(provider, providerChain) {
  if (Array.isArray(providerChain) && providerChain.length > 0) {
    return providerChain.map((entry, index) => {
      if (entry?.provider && typeof entry.provider.synthesize === "function") {
        return {
          id: entry.id ?? entry.provider.id ?? `provider-${index}`,
          provider: entry.provider,
        };
      }
      if (entry && typeof entry.synthesize === "function") {
        return {
          id: entry.id ?? `provider-${index}`,
          provider: entry,
        };
      }
      throw new TypeError("providerChain entries must expose synthesize()");
    });
  }

  if (!provider || typeof provider.synthesize !== "function") {
    throw new TypeError("A TTS provider with synthesize(text) is required");
  }
  if (typeof provider.getSynthesisIdentity !== "function") {
    throw new TypeError("A TTS provider with getSynthesisIdentity() is required");
  }

  return [{ id: provider.id ?? "primary", provider }];
}

async function synthesizeWithCapacityFallback({
  chain,
  startIndex,
  text,
  filename,
}) {
  let lastError;
  for (let index = startIndex; index < chain.length; index += 1) {
    const entry = chain[index];
    try {
      const audio = await entry.provider.synthesize(text);
      return {
        audio,
        provider: entry.provider,
        chainIndex: index,
        switchedFrom: index === startIndex ? null : chain[startIndex].id,
      };
    } catch (error) {
      lastError = error;
      const hasFallback = index < chain.length - 1;
      if (hasFallback && isProviderCapacityError(error)) {
        console.warn(
          `Provider ${entry.id} capacity error on ${filename}; switching to ${chain[index + 1].id}.`,
        );
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

function buildManifest({
  sourceText,
  speechText,
  preparedText,
  sourceReference,
  adaptationReference,
  activeProvider,
  files,
  expectedSegmentCount,
  status,
  forceRerender,
  providerSwitches,
  maxCharacters,
}) {
  const activeIdentity = publicSynthesisIdentity(activeProvider.getSynthesisIdentity());
  const providersUsed = [...new Set(files.map((file) => file.provider_id).filter(Boolean))];

  return {
    schema: AUDIBLE_MANIFEST_SCHEMA,
    updated_at: new Date().toISOString(),
    status,
    source_reference: sourceReference,
    adaptation_reference: adaptationReference,
    source_sha256: sha256(Buffer.from(sourceText, "utf8")),
    spoken_text_sha256: sha256(Buffer.from(speechText, "utf8")),
    prepared_text_sha256: sha256(Buffer.from(preparedText, "utf8")),
    // Active provider at end of render (may differ from some segment providers).
    provider_id: activeProvider.id ?? activeIdentity.provider_id,
    provider: activeProvider.constructor?.name ?? null,
    voice_id: activeProvider.voiceId ?? activeIdentity.voice_id ?? null,
    output_format: activeProvider.outputFormat ?? activeIdentity.output?.container ?? "wav",
    synthesis: activeIdentity,
    synthesis_identity_sha256: activeIdentity.synthesis_identity_sha256,
    providers_used: providersUsed,
    mixed_providers: providersUsed.length > 1,
    force_rerender: forceRerender === true,
    provider_switches: providerSwitches,
    max_characters: maxCharacters,
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

function assertRenderableAudio(audio, outputFormat, filename) {
  if (!Buffer.isBuffer(audio) || audio.length === 0) {
    throw new Error(`TTS returned empty audio for ${filename}`);
  }

  if (outputFormat.toLowerCase() !== "wav") {
    if (audio.length < 64) {
      throw new Error(
        `TTS returned an implausibly small audio payload for ${filename} (${audio.length} bytes)`,
      );
    }
    return;
  }

  if (!wavHasPcmSamples(audio)) {
    throw new Error(
      `TTS returned a WAV container with no PCM samples for ${filename}. Re-render this segment after checking provider credits/status.`,
    );
  }
}

async function isReusableSegmentFile(filename, outputFormat) {
  try {
    const fileStat = await stat(filename);
    if (!fileStat.isFile() || fileStat.size === 0) return false;
    if (outputFormat.toLowerCase() !== "wav") return fileStat.size >= 64;
    const buffer = await readFile(filename);
    return wavHasPcmSamples(buffer);
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
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

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}
