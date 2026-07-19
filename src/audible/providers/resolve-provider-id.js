/**
 * Resolve which TTS provider to use.
 *
 * Precedence:
 * 1. explicit CLI / call override
 * 2. UBIKIA_TTS_PROVIDER environment variable
 * 3. audio.defaultProvider from configuration
 * 4. default "gradium"
 */

export const DEFAULT_TTS_PROVIDER_ID = "gradium";

export function resolveProviderId({
  cliProvider = null,
  environment = process.env,
  config = null,
  defaultProvider = DEFAULT_TTS_PROVIDER_ID,
} = {}) {
  const candidates = [
    normalize(cliProvider),
    normalize(environment?.UBIKIA_TTS_PROVIDER),
    normalize(config?.audio?.defaultProvider),
    normalize(defaultProvider),
    DEFAULT_TTS_PROVIDER_ID,
  ];

  return candidates.find(Boolean) ?? DEFAULT_TTS_PROVIDER_ID;
}

/**
 * Ordered fallback providers for capacity errors during a partial render.
 * Primary is excluded. Values may come from CLI, env, or config.
 */
export function resolveFallbackProviderIds({
  primaryProviderId,
  cliFallbacks = null,
  environment = process.env,
  config = null,
} = {}) {
  const fromCli = parseList(cliFallbacks);
  const fromEnv = parseList(environment?.UBIKIA_TTS_FALLBACK_PROVIDERS);
  const fromConfig = Array.isArray(config?.audio?.fallbackProviders)
    ? config.audio.fallbackProviders.map(normalize).filter(Boolean)
    : [];

  const ordered = [...fromCli, ...fromEnv, ...fromConfig];
  const seen = new Set();
  const result = [];
  for (const id of ordered) {
    if (!id || id === primaryProviderId || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

function normalize(value) {
  if (value == null) return null;
  const text = String(value).trim().toLowerCase();
  return text === "" ? null : text;
}

function parseList(value) {
  if (value == null || value === true) return [];
  if (Array.isArray(value)) return value.map(normalize).filter(Boolean);
  return String(value)
    .split(",")
    .map((part) => normalize(part))
    .filter(Boolean);
}
