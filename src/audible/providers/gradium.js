const DEFAULT_TTS_URL = "https://api.gradium.ai/api/post/speech/tts";

export class GradiumTTSProvider {
  constructor({
    apiKey = process.env.GRADIUM_API_KEY,
    voiceId = process.env.GRADIUM_VOICE_ID,
    endpoint = process.env.GRADIUM_TTS_URL ?? DEFAULT_TTS_URL,
    outputFormat = process.env.UBIKIA_AUDIO_FORMAT ?? "wav",
  } = {}) {
    if (!apiKey) throw new Error("GRADIUM_API_KEY is required");
    if (!voiceId) throw new Error("GRADIUM_VOICE_ID is required");

    this.apiKey = apiKey;
    this.voiceId = voiceId;
    this.endpoint = endpoint;
    this.outputFormat = outputFormat;
  }

  async synthesize(text, { signal } = {}) {
    if (typeof text !== "string" || text.trim() === "") {
      throw new TypeError("The text to synthesize must be a non-empty string");
    }

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
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
      throw new Error(`Gradium TTS failed (${response.status}): ${detail}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }
}
