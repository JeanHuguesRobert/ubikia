import {
  defaultIsRetryable,
  withRetries,
} from "./retry.js";
import { buildSynthesisIdentity } from "./synthesis-identity.js";

const DEFAULT_TTS_URL = "https://api.gradium.ai/api/post/speech/tts";
export const GRADIUM_PROVIDER_ID = "gradium";

export class GradiumTTSProvider {
  constructor({
    apiKey = process.env.GRADIUM_API_KEY,
    voiceId = process.env.GRADIUM_VOICE_ID,
    endpoint = process.env.GRADIUM_TTS_URL ?? DEFAULT_TTS_URL,
    outputFormat = process.env.UBIKIA_AUDIO_FORMAT ?? "wav",
    language = process.env.UBIKIA_AUDIO_LANGUAGE ?? null,
    model = process.env.GRADIUM_MODEL ?? null,
    maxAttempts = 4,
    retryDelayMs = 1500,
    fetchImpl = globalThis.fetch?.bind(globalThis),
  } = {}) {
    if (!apiKey) throw new Error("GRADIUM_API_KEY is required");
    if (!voiceId) throw new Error("GRADIUM_VOICE_ID is required");

    this.id = GRADIUM_PROVIDER_ID;
    this.apiKey = apiKey;
    this.voiceId = voiceId;
    this.endpoint = endpoint ?? DEFAULT_TTS_URL;
    this.outputFormat = outputFormat ?? "wav";
    this.language = language ?? null;
    this.model = model ?? null;
    this.maxAttempts = maxAttempts;
    this.retryDelayMs = retryDelayMs;
    this.fetchImpl = fetchImpl;
  }

  getSynthesisIdentity() {
    return buildSynthesisIdentity({
      providerId: this.id,
      model: this.model,
      apiVersion: null,
      voiceId: this.voiceId,
      language: this.language,
      output: {
        container: this.outputFormat,
        encoding: this.outputFormat === "wav" ? "pcm_s16le" : null,
        sample_rate: null,
        codec: null,
      },
      settings: null,
      seed: null,
    });
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
        label: "Gradium",
        signal,
      },
    );
  }

  async #synthesizeOnce(text, { signal } = {}) {
    const response = await this.fetchImpl(this.endpoint, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
        Connection: "close",
      },
      body: JSON.stringify({
        text: text.trim(),
        voice_id: this.voiceId,
        output_format: this.outputFormat,
        only_audio: true,
      }),
      signal,
    });

    if (!response.ok) {
      const detail = await safeResponseDetail(response);
      const error = new Error(`Gradium TTS failed (${response.status})`);
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
    // Keep a short excerpt for operators; never log request headers/keys.
    return text.slice(0, 200);
  } catch {
    return null;
  }
}
