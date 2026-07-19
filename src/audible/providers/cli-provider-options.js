import { createTTSProviderChain } from "./create-tts-provider.js";

/**
 * Shared CLI wiring for render / finalize provider selection.
 * Never logs secret values.
 */
export function buildProviderChainFromCliOptions(options, {
  environment = process.env,
  config = null,
} = {}) {
  const language = options.language
    ?? environment.UBIKIA_AUDIO_LANGUAGE
    ?? null;
  const format = options.format ?? environment.UBIKIA_AUDIO_FORMAT ?? "wav";
  const model = options.model ?? null;
  const sampleRate = options.sampleRate
    ? Number.parseInt(options.sampleRate, 10)
    : undefined;

  const providerOptions = {
    outputFormat: format,
    language: language ?? undefined,
  };
  if (model) providerOptions.model = model;
  if (Number.isFinite(sampleRate)) providerOptions.sampleRate = sampleRate;

  return createTTSProviderChain({
    providerId: options.provider ?? null,
    fallbackProviders: options.fallbackProviders ?? options.fallbackProvider ?? null,
    environment,
    config,
    providerOptions,
  });
}
