import { createHash } from "node:crypto";

/**
 * Build a secret-free, stable synthesis identity for cache + provenance.
 * Callers must never pass API keys or Authorization values.
 */
export function buildSynthesisIdentity({
  providerId,
  model = null,
  apiVersion = null,
  voiceId = null,
  voiceFingerprint = null,
  language = null,
  output = null,
  settings = null,
  seed = null,
} = {}) {
  if (!providerId || typeof providerId !== "string") {
    throw new TypeError("providerId is required");
  }

  const identity = {
    provider_id: providerId,
    model: model ?? null,
    api_version: apiVersion ?? null,
    voice_id: voiceId ?? null,
    voice_fingerprint: voiceFingerprint ?? null,
    language: language ?? null,
    output: normalizeOutput(output),
    settings: normalizeSettings(settings),
    seed: seed ?? null,
  };

  return {
    ...identity,
    synthesis_identity_sha256: hashSynthesisIdentity(identity),
  };
}

export function hashSynthesisIdentity(identity) {
  const canonical = canonicalize({
    provider_id: identity.provider_id ?? null,
    model: identity.model ?? null,
    api_version: identity.api_version ?? null,
    voice_id: identity.voice_id ?? null,
    voice_fingerprint: identity.voice_fingerprint ?? null,
    language: identity.language ?? null,
    output: identity.output ?? null,
    settings: identity.settings ?? null,
    seed: identity.seed ?? null,
  });
  return createHash("sha256").update(JSON.stringify(canonical), "utf8").digest("hex");
}

/**
 * Public subset for manifests and logs — never secrets.
 */
export function publicSynthesisIdentity(identity) {
  if (!identity || typeof identity !== "object") return null;
  return {
    provider_id: identity.provider_id ?? null,
    model: identity.model ?? null,
    api_version: identity.api_version ?? null,
    voice_id: identity.voice_id ?? null,
    voice_fingerprint: identity.voice_fingerprint ?? null,
    language: identity.language ?? null,
    output: identity.output ?? null,
    settings: identity.settings ?? null,
    seed: identity.seed ?? null,
    synthesis_identity_sha256: identity.synthesis_identity_sha256
      ?? hashSynthesisIdentity(identity),
  };
}

function normalizeOutput(output) {
  if (!output || typeof output !== "object") {
    return {
      container: null,
      encoding: null,
      sample_rate: null,
      codec: null,
    };
  }
  return {
    container: output.container ?? output.format ?? null,
    encoding: output.encoding ?? null,
    sample_rate: output.sample_rate ?? output.sampleRate ?? null,
    codec: output.codec ?? null,
  };
}

function normalizeSettings(settings) {
  if (!settings || typeof settings !== "object") return null;
  return canonicalize(settings);
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry));
  }
  if (value && typeof value === "object") {
    const result = {};
    for (const key of Object.keys(value).sort()) {
      // Defensive: drop any accidentally supplied secret-like keys.
      if (isSecretLikeKey(key)) continue;
      const entry = value[key];
      if (entry === undefined) continue;
      result[key] = canonicalize(entry);
    }
    return result;
  }
  return value;
}

function isSecretLikeKey(key) {
  const normalized = String(key).toLowerCase();
  return (
    normalized.includes("api_key")
    || normalized.includes("apikey")
    || normalized.includes("authorization")
    || normalized.includes("password")
    || normalized.includes("secret")
    || normalized.includes("token")
  );
}
