import { CartesiaTTSProvider, CARTESIA_PROVIDER_ID } from "./cartesia.js";
import { GradiumTTSProvider, GRADIUM_PROVIDER_ID } from "./gradium.js";
import {
  DEFAULT_TTS_PROVIDER_ID,
  resolveFallbackProviderIds,
  resolveProviderId,
} from "./resolve-provider-id.js";

/**
 * Small file-based registry. A future provider = one adapter module + one entry
 * here + config/docs/tests — not a change to the render pipeline.
 */
const PROVIDER_REGISTRY = {
  [GRADIUM_PROVIDER_ID]: {
    id: GRADIUM_PROVIDER_ID,
    create: (options) => new GradiumTTSProvider(options),
  },
  [CARTESIA_PROVIDER_ID]: {
    id: CARTESIA_PROVIDER_ID,
    create: (options) => new CartesiaTTSProvider(options),
  },
};

export function listRegisteredProviderIds() {
  return Object.keys(PROVIDER_REGISTRY);
}

export function createTTSProvider({
  providerId = null,
  environment = process.env,
  config = null,
  ...providerOptions
} = {}) {
  const resolvedId = resolveProviderId({
    cliProvider: providerId,
    environment,
    config,
  });

  const entry = PROVIDER_REGISTRY[resolvedId];
  if (!entry) {
    throw new Error(
      `Unknown TTS provider "${resolvedId}". Registered providers: ${listRegisteredProviderIds().join(", ")}`,
    );
  }

  return entry.create({
    ...optionsFromEnvironment(resolvedId, environment),
    ...providerOptions,
  });
}

/**
 * Map environment variable names into constructor options.
 * Values are not logged; tests may inject a fake environment object.
 */
function optionsFromEnvironment(providerId, environment = {}) {
  if (providerId === GRADIUM_PROVIDER_ID) {
    return {
      apiKey: environment.GRADIUM_API_KEY,
      voiceId: environment.GRADIUM_VOICE_ID,
      endpoint: environment.GRADIUM_TTS_URL,
      outputFormat: environment.UBIKIA_AUDIO_FORMAT,
      language: environment.UBIKIA_AUDIO_LANGUAGE,
      model: environment.GRADIUM_MODEL,
    };
  }
  if (providerId === CARTESIA_PROVIDER_ID) {
    return {
      apiKey: environment.CARTESIA_API_KEY,
      voiceId: environment.CARTESIA_VOICE_ID,
      endpoint: environment.CARTESIA_TTS_URL,
      apiVersion: environment.CARTESIA_API_VERSION,
      model: environment.CARTESIA_MODEL,
      language: environment.UBIKIA_AUDIO_LANGUAGE ?? environment.CARTESIA_LANGUAGE,
      sampleRate: environment.CARTESIA_SAMPLE_RATE
        ? Number.parseInt(environment.CARTESIA_SAMPLE_RATE, 10)
        : undefined,
      outputFormat: environment.UBIKIA_AUDIO_FORMAT,
    };
  }
  return {};
}

/**
 * Build the ordered provider chain for a render:
 * primary first, then configured fallbacks for capacity errors only.
 */
export function createTTSProviderChain({
  providerId = null,
  fallbackProviders = null,
  environment = process.env,
  config = null,
  providerOptions = {},
} = {}) {
  const primaryId = resolveProviderId({
    cliProvider: providerId,
    environment,
    config,
  });
  const fallbackIds = resolveFallbackProviderIds({
    primaryProviderId: primaryId,
    cliFallbacks: fallbackProviders,
    environment,
    config,
  });

  const chain = [primaryId, ...fallbackIds].map((id) => ({
    id,
    provider: createTTSProvider({
      providerId: id,
      environment,
      config,
      ...providerOptions,
    }),
  }));

  return {
    primaryId,
    fallbackIds,
    defaultProvider: DEFAULT_TTS_PROVIDER_ID,
    chain,
  };
}

export { PROVIDER_REGISTRY };
