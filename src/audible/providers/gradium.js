const DEFAULT_TTS_URL = "https://api.gradium.ai/api/post/speech/tts";

export class GradiumTTSProvider {
  constructor({
    apiKey = process.env.GRADIUM_API_KEY,
    voiceId = process.env.GRADIUM_VOICE_ID,
    endpoint = process.env.GRADIUM_TTS_URL ?? DEFAULT_TTS_URL,
    outputFormat = process.env.UBIKIA_AUDIO_FORMAT ?? "wav",
    maxAttempts = 4,
    retryDelayMs = 1500,
  } = {}) {
    if (!apiKey) throw new Error("GRADIUM_API_KEY is required");
    if (!voiceId) throw new Error("GRADIUM_VOICE_ID is required");

    this.apiKey = apiKey;
    this.voiceId = voiceId;
    this.endpoint = endpoint;
    this.outputFormat = outputFormat;
    this.maxAttempts = maxAttempts;
    this.retryDelayMs = retryDelayMs;
  }

  async synthesize(text, { signal } = {}) {
    if (typeof text !== "string" || text.trim() === "") {
      throw new TypeError("The text to synthesize must be a non-empty string");
    }

    let lastError;
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        return await this.#synthesizeOnce(text, { signal });
      } catch (error) {
        lastError = error;
        if (!isRetryable(error) || attempt === this.maxAttempts) throw error;
        const delay = this.retryDelayMs * (2 ** (attempt - 1));
        console.warn(`Gradium attempt ${attempt}/${this.maxAttempts} failed: ${error.message}. Retry in ${delay} ms.`);
        await sleep(delay, signal);
      }
    }

    throw lastError;
  }

  async #synthesizeOnce(text, { signal } = {}) {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
        "Connection": "close",
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
      const detail = await response.text();
      const error = new Error(`Gradium TTS failed (${response.status}): ${detail}`);
      error.status = response.status;
      throw error;
    }

    return Buffer.from(await response.arrayBuffer());
  }
}

function isRetryable(error) {
  if (error?.name === "AbortError") return false;
  if (Number.isInteger(error?.status)) {
    return error.status === 408 || error.status === 429 || error.status >= 500;
  }
  return error instanceof TypeError || error?.cause?.code === "UND_ERR_SOCKET";
}

function sleep(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason ?? new Error("Aborted"));
    }, { once: true });
  });
}
