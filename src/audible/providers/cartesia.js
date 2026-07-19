import {
  defaultIsRetryable,
  withRetries,
} from "./retry.js";
import { buildSynthesisIdentity } from "./synthesis-identity.js";

export const CARTESIA_PROVIDER_ID = "cartesia";
export const DEFAULT_CARTESIA_API_VERSION = "2026-03-01";
export const DEFAULT_CARTESIA_MODEL = "sonic-3.5";
export const DEFAULT_CARTESIA_ENDPOINT = "https://api.cartesia.ai/tts/bytes";
export const DEFAULT_CARTESIA_SAMPLE_RATE = 44100;

export class CartesiaTTSProvider {
  constructor({
    apiKey = process.env.CARTESIA_API_KEY,
    voiceId = process.env.CARTESIA_VOICE_ID,
    endpoint = process.env.CARTESIA_TTS_URL ?? DEFAULT_CARTESIA_ENDPOINT,
    apiVersion = process.env.CARTESIA_API_VERSION ?? DEFAULT_CARTESIA_API_VERSION,
    model = process.env.CARTESIA_MODEL ?? DEFAULT_CARTESIA_MODEL,
    language = process.env.UBIKIA_AUDIO_LANGUAGE ?? process.env.CARTESIA_LANGUAGE ?? "fr",
    sampleRate = Number.parseInt(
      process.env.CARTESIA_SAMPLE_RATE ?? String(DEFAULT_CARTESIA_SAMPLE_RATE),
      10,
    ),
    encoding = "pcm_s16le",
    outputFormat = "wav",
    generationConfig = null,
    maxAttempts = 4,
    retryDelayMs = 1500,
    fetchImpl = globalThis.fetch?.bind(globalThis),
  } = {}) {
    if (!apiKey) throw new Error("CARTESIA_API_KEY is required");
    if (!voiceId) throw new Error("CARTESIA_VOICE_ID is required");
    const resolvedFormat = outputFormat ?? "wav";
    if (resolvedFormat !== "wav") {
      throw new Error("Cartesia adapter currently supports only WAV output for FFmpeg assembly");
    }

    this.id = CARTESIA_PROVIDER_ID;
    this.apiKey = apiKey;
    this.voiceId = voiceId;
    this.endpoint = endpoint ?? DEFAULT_CARTESIA_ENDPOINT;
    this.apiVersion = apiVersion ?? DEFAULT_CARTESIA_API_VERSION;
    this.model = model ?? DEFAULT_CARTESIA_MODEL;
    this.language = language ?? "fr";
    this.sampleRate = Number.isFinite(sampleRate) ? sampleRate : DEFAULT_CARTESIA_SAMPLE_RATE;
    this.encoding = encoding ?? "pcm_s16le";
    this.outputFormat = resolvedFormat;
    this.generationConfig = generationConfig;
    this.maxAttempts = maxAttempts;
    this.retryDelayMs = retryDelayMs;
    this.fetchImpl = fetchImpl;
  }

  getSynthesisIdentity() {
    return buildSynthesisIdentity({
      providerId: this.id,
      model: this.model,
      apiVersion: this.apiVersion,
      voiceId: this.voiceId,
      language: this.language,
      output: {
        container: "wav",
        encoding: this.encoding,
        sample_rate: this.sampleRate,
        codec: null,
      },
      settings: this.generationConfig
        ? { generation_config: this.generationConfig }
        : null,
      seed: null,
    });
  }

  /**
   * Build the public request body shape for tests and debugging.
   * Does not include credentials.
   */
  buildRequestBody(text) {
    const body = {
      model_id: this.model,
      transcript: String(text).trim(),
      voice: {
        mode: "id",
        id: this.voiceId,
      },
      language: this.language,
      output_format: {
        container: "wav",
        encoding: this.encoding,
        sample_rate: this.sampleRate,
      },
    };
    if (this.generationConfig) {
      body.generation_config = this.generationConfig;
    }
    return body;
  }

  async synthesize(text, { signal } = {}) {
    if (typeof text !== "string" || text.trim() === "") {
      throw new TypeError("The text to synthesize must be a non-empty string");
    }

    return withRetries(
      () => this.#synthesizeOnce(text, { signal }),
      {
        maxAttempts: this.maxAttempts,
        retryDelayMs: this.retryDelayMs,
        isRetryable: defaultIsRetryable,
        label: "Cartesia",
        signal,
      },
    );
  }

  async #synthesizeOnce(text, { signal } = {}) {
    const response = await this.fetchImpl(this.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Cartesia-Version": this.apiVersion,
        "Content-Type": "application/json",
        Connection: "close",
      },
      body: JSON.stringify(this.buildRequestBody(text)),
      signal,
    });

    if (!response.ok) {
      const detail = await safeResponseDetail(response);
      const error = new Error(`Cartesia TTS failed (${response.status})`);
      error.status = response.status;
      error.provider_id = this.id;
      error.detail_excerpt = detail;
      throw error;
    }

    return Buffer.from(await response.arrayBuffer());
  }
}

async function safeResponseDetail(response) {
  try {
    const text = await response.text();
    return text.slice(0, 200);
  } catch {
    return null;
  }
}
