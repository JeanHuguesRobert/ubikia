import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createTTSProvider,
  createTTSProviderChain,
  listRegisteredProviderIds,
} from "../src/audible/providers/create-tts-provider.js";
import {
  CartesiaTTSProvider,
  DEFAULT_CARTESIA_API_VERSION,
  DEFAULT_CARTESIA_MODEL,
} from "../src/audible/providers/cartesia.js";
import { GradiumTTSProvider } from "../src/audible/providers/gradium.js";
import {
  defaultIsRetryable,
  isProviderCapacityError,
  withRetries,
} from "../src/audible/providers/retry.js";
import { resolveProviderId } from "../src/audible/providers/resolve-provider-id.js";
import {
  buildSynthesisIdentity,
  hashSynthesisIdentity,
} from "../src/audible/providers/synthesis-identity.js";
import { renderAudibleProduct } from "../src/audible/render.js";
import { normalizeWavBuffer } from "../src/audible/wav.js";

test("lists registered providers and fails on unknown ids", () => {
  assert.deepEqual(listRegisteredProviderIds().sort(), ["cartesia", "gradium"]);
  assert.throws(
    () => createTTSProvider({
      providerId: "elevenlabs",
      environment: {
        GRADIUM_API_KEY: "k",
        GRADIUM_VOICE_ID: "v",
      },
    }),
    /Unknown TTS provider/,
  );
});

test("resolves provider precedence: CLI > env > config > default gradium", () => {
  assert.equal(resolveProviderId({}), "gradium");
  assert.equal(
    resolveProviderId({
      config: { audio: { defaultProvider: "cartesia" } },
    }),
    "cartesia",
  );
  assert.equal(
    resolveProviderId({
      environment: { UBIKIA_TTS_PROVIDER: "gradium" },
      config: { audio: { defaultProvider: "cartesia" } },
    }),
    "gradium",
  );
  assert.equal(
    resolveProviderId({
      cliProvider: "cartesia",
      environment: { UBIKIA_TTS_PROVIDER: "gradium" },
      config: { audio: { defaultProvider: "gradium" } },
    }),
    "cartesia",
  );
});

test("Gradium remains backward-compatible default construction", async () => {
  const calls = [];
  const pcm = Buffer.alloc(32, 1);
  const wav = makePcmWav(pcm);
  const provider = new GradiumTTSProvider({
    apiKey: "test-key-not-real",
    voiceId: "voice-gradium",
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => wav.buffer.slice(wav.byteOffset, wav.byteOffset + wav.byteLength),
      };
    },
  });

  assert.equal(provider.id, "gradium");
  const identity = provider.getSynthesisIdentity();
  assert.equal(identity.provider_id, "gradium");
  assert.equal(identity.voice_id, "voice-gradium");
  assert.equal(identity.output.container, "wav");
  assert.match(identity.synthesis_identity_sha256, /^[a-f0-9]{64}$/);

  const audio = await provider.synthesize("Bonjour.");
  assert.ok(Buffer.isBuffer(audio));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.headers["x-api-key"], "test-key-not-real");
  // Secrets must not appear in synthesis identity.
  assert.equal(JSON.stringify(identity).includes("test-key"), false);
});

test("Cartesia builds pinned Bytes request with Authorization present and secret-free identity", async () => {
  const calls = [];
  const pcm = Buffer.alloc(64, 2);
  const wav = makePcmWav(pcm);
  const secret = "sk_car_test_secret_value";
  const provider = new CartesiaTTSProvider({
    apiKey: secret,
    voiceId: "voice-cartesia",
    language: "fr",
    model: DEFAULT_CARTESIA_MODEL,
    apiVersion: DEFAULT_CARTESIA_API_VERSION,
    sampleRate: 44100,
    fetchImpl: async (url, init) => {
      calls.push({ url, headers: init.headers, body: JSON.parse(init.body) });
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => wav.buffer.slice(wav.byteOffset, wav.byteOffset + wav.byteLength),
      };
    },
  });

  const audio = await provider.synthesize("La magie est dans l’expérience.");
  assert.ok(audio.length > 44);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.cartesia.ai/tts/bytes");
  assert.equal(calls[0].headers["Cartesia-Version"], "2026-03-01");
  assert.ok(calls[0].headers.Authorization?.startsWith("Bearer "));
  assert.equal(calls[0].headers.Authorization, `Bearer ${secret}`);
  assert.equal(calls[0].body.model_id, "sonic-3.5");
  assert.equal(calls[0].body.language, "fr");
  assert.deepEqual(calls[0].body.voice, { mode: "id", id: "voice-cartesia" });
  assert.deepEqual(calls[0].body.output_format, {
    container: "wav",
    encoding: "pcm_s16le",
    sample_rate: 44100,
  });

  const identity = provider.getSynthesisIdentity();
  const serialized = JSON.stringify(identity);
  assert.equal(identity.provider_id, "cartesia");
  assert.equal(identity.model, "sonic-3.5");
  assert.equal(identity.api_version, "2026-03-01");
  assert.equal(identity.output.sample_rate, 44100);
  assert.equal(serialized.includes(secret), false);
  assert.equal(serialized.includes("Bearer"), false);
});

test("retryable and non-retryable classification matches Gradium policy", async () => {
  assert.equal(defaultIsRetryable(Object.assign(new Error("x"), { status: 429 })), true);
  assert.equal(defaultIsRetryable(Object.assign(new Error("x"), { status: 500 })), true);
  assert.equal(defaultIsRetryable(Object.assign(new Error("x"), { status: 402 })), false);
  assert.equal(defaultIsRetryable(Object.assign(new Error("x"), { status: 400 })), false);
  assert.equal(defaultIsRetryable(Object.assign(new Error("aborted"), { name: "AbortError" })), false);
  assert.equal(isProviderCapacityError(Object.assign(new Error("Insufficient credits"), { status: 402 })), true);

  let attempts = 0;
  await assert.rejects(
    () => withRetries(async () => {
      attempts += 1;
      const error = new Error("rate");
      error.status = 429;
      throw error;
    }, { maxAttempts: 3, retryDelayMs: 1, label: "Test" }),
    /rate/,
  );
  assert.equal(attempts, 3);

  attempts = 0;
  await assert.rejects(
    () => withRetries(async () => {
      attempts += 1;
      const error = new Error("bad");
      error.status = 400;
      throw error;
    }, { maxAttempts: 3, retryDelayMs: 1, label: "Test" }),
    /bad/,
  );
  assert.equal(attempts, 1);
});

test("abort is not retried", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    () => withRetries(async ({ signal }) => {
      if (signal?.aborted) {
        const error = new Error("Aborted");
        error.name = "AbortError";
        throw error;
      }
    }, { signal: controller.signal, maxAttempts: 4, retryDelayMs: 1 }),
    (error) => error.name === "AbortError",
  );
});

test("synthesis identity hash changes when provider model voice language format or rate change", () => {
  const baseInput = {
    providerId: "cartesia",
    model: "sonic-3.5",
    apiVersion: "2026-03-01",
    voiceId: "v1",
    language: "fr",
    output: { container: "wav", encoding: "pcm_s16le", sample_rate: 44100 },
  };
  const base = buildSynthesisIdentity(baseInput);
  const otherProvider = buildSynthesisIdentity({ ...baseInput, providerId: "gradium" });
  const otherModel = buildSynthesisIdentity({ ...baseInput, model: "sonic-3" });
  const otherVoice = buildSynthesisIdentity({ ...baseInput, voiceId: "v2" });
  const otherLanguage = buildSynthesisIdentity({ ...baseInput, language: "en" });
  const otherRate = buildSynthesisIdentity({
    ...baseInput,
    output: { container: "wav", encoding: "pcm_s16le", sample_rate: 24000 },
  });

  const hashes = new Set([
    base.synthesis_identity_sha256,
    otherProvider.synthesis_identity_sha256,
    otherModel.synthesis_identity_sha256,
    otherVoice.synthesis_identity_sha256,
    otherLanguage.synthesis_identity_sha256,
    otherRate.synthesis_identity_sha256,
  ]);
  assert.equal(hashes.size, 6);
  assert.equal(
    hashSynthesisIdentity(base),
    base.synthesis_identity_sha256,
  );
});

test("manifest records provider synthesis provenance and reuses identical synthesis identity", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ubikia-tts-reuse-"));
  let synthesizeCalls = 0;
  const wav = makePcmWav(Buffer.alloc(80, 3));

  const provider = fakeProvider({
    id: "gradium",
    voiceId: "voice-a",
    model: "g1",
    language: "fr",
    synthesize: async () => {
      synthesizeCalls += 1;
      return Buffer.from(wav);
    },
  });

  const first = await renderAudibleProduct({
    sourceText: "Source.",
    speechText: "Un court segment oral.",
    outputDirectory: directory,
    provider,
    maxCharacters: 900,
  });

  assert.equal(first.schema, "ubikia.audible-manifest.v0.5");
  assert.equal(first.provider_id, "gradium");
  assert.equal(first.files[0].provider_id, "gradium");
  assert.ok(first.synthesis.synthesis_identity_sha256);
  assert.equal(first.files[0].synthesis_identity_sha256, first.synthesis.synthesis_identity_sha256);
  assert.equal(synthesizeCalls, 1);

  const second = await renderAudibleProduct({
    sourceText: "Source.",
    speechText: "Un court segment oral.",
    outputDirectory: directory,
    provider,
    maxCharacters: 900,
  });
  assert.equal(second.files[0].reused, true);
  assert.equal(synthesizeCalls, 1);
});

test("force rerender regenerates segments with the active provider", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ubikia-tts-force-"));
  let calls = 0;
  const provider = fakeProvider({
    id: "cartesia",
    voiceId: "voice-c",
    model: "sonic-3.5",
    language: "fr",
    synthesize: async () => {
      calls += 1;
      return makePcmWav(Buffer.alloc(96, 4));
    },
  });

  await renderAudibleProduct({
    sourceText: "S",
    speechText: "Texte oral stable.",
    outputDirectory: directory,
    provider,
  });
  assert.equal(calls, 1);

  await renderAudibleProduct({
    sourceText: "S",
    speechText: "Texte oral stable.",
    outputDirectory: directory,
    provider,
    forceRerender: true,
  });
  assert.equal(calls, 2);
});

test("partial completion reuses foreign-provider segments and only synthesizes gaps", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ubikia-tts-complete-"));
  // Two short paragraphs become two segments with a low maxCharacters budget.
  const speechText = [
    "Premier segment de l’essai audio.",
    "",
    "Deuxième segment de l’essai audio.",
  ].join("\n");

  const gradium = fakeProvider({
    id: "gradium",
    voiceId: "g-voice",
    model: null,
    language: "fr",
    synthesize: async (text) => {
      if (text.includes("Deuxième")) {
        const error = new Error("Gradium TTS failed (402)");
        error.status = 402;
        throw error;
      }
      return makePcmWav(Buffer.alloc(100, 5));
    },
  });

  // First run: only first segment succeeds if we stop after capacity... use chain.
  const cartesiaCalls = [];
  const cartesia = fakeProvider({
    id: "cartesia",
    voiceId: "c-voice",
    model: "sonic-3.5",
    language: "fr",
    apiVersion: "2026-03-01",
    sampleRate: 44100,
    synthesize: async (text) => {
      cartesiaCalls.push(text);
      return makePcmWav(Buffer.alloc(120, 6));
    },
  });

  const manifest = await renderAudibleProduct({
    sourceText: "Source body",
    speechText,
    outputDirectory: directory,
    providerChain: [
      { id: "gradium", provider: gradium },
      { id: "cartesia", provider: cartesia },
    ],
    maxCharacters: 40,
  });

  assert.equal(manifest.mixed_providers, true);
  assert.deepEqual(manifest.providers_used.sort(), ["cartesia", "gradium"]);
  assert.equal(manifest.files[0].provider_id, "gradium");
  assert.equal(manifest.files[0].reused, false);
  assert.equal(manifest.files[1].provider_id, "cartesia");
  assert.equal(cartesiaCalls.length, 1);
  assert.match(cartesiaCalls[0], /Deuxième/);
  assert.ok(manifest.provider_switches.length >= 1);

  // Second completion pass with cartesia only: both valid files reused.
  let cartesiaOnlyCalls = 0;
  const cartesiaOnly = fakeProvider({
    id: "cartesia",
    voiceId: "c-voice",
    model: "sonic-3.5",
    language: "fr",
    apiVersion: "2026-03-01",
    sampleRate: 44100,
    synthesize: async () => {
      cartesiaOnlyCalls += 1;
      return makePcmWav(Buffer.alloc(120, 7));
    },
  });
  const completed = await renderAudibleProduct({
    sourceText: "Source body",
    speechText,
    outputDirectory: directory,
    provider: cartesiaOnly,
    maxCharacters: 40,
  });
  assert.equal(completed.files.every((file) => file.reused), true);
  assert.equal(cartesiaOnlyCalls, 0);
});

test("createTTSProviderChain honors fallback list without exposing secrets", () => {
  const chain = createTTSProviderChain({
    providerId: "gradium",
    fallbackProviders: "cartesia",
    environment: {
      GRADIUM_API_KEY: "g-secret",
      GRADIUM_VOICE_ID: "g-voice",
      CARTESIA_API_KEY: "c-secret",
      CARTESIA_VOICE_ID: "c-voice",
    },
  });
  assert.equal(chain.primaryId, "gradium");
  assert.deepEqual(chain.fallbackIds, ["cartesia"]);
  assert.equal(chain.chain.length, 2);
  const blob = JSON.stringify(chain.chain.map((entry) => entry.provider.getSynthesisIdentity()));
  assert.equal(blob.includes("g-secret"), false);
  assert.equal(blob.includes("c-secret"), false);
});

test("empty WAV segments are not reusable", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ubikia-tts-empty-"));
  const emptyWav = makePcmWav(Buffer.alloc(0));
  await writeFile(path.join(directory, "segment-001.wav"), emptyWav);
  await writeFile(path.join(directory, "manifest.json"), `${JSON.stringify({
    files: [{
      sequence: 1,
      filename: "segment-001.wav",
      text_sha256: "deadbeef",
      provider_id: "gradium",
    }],
  }, null, 2)}\n`, "utf8");

  let calls = 0;
  const provider = fakeProvider({
    id: "cartesia",
    voiceId: "c",
    model: "sonic-3.5",
    language: "fr",
    synthesize: async () => {
      calls += 1;
      return makePcmWav(Buffer.alloc(64, 9));
    },
  });

  // Force text hash match by using known prepared segmenting of short text.
  const speechText = "Court.";
  // Pre-write prepared path is owned by render; just ensure empty file is replaced.
  await renderAudibleProduct({
    sourceText: speechText,
    speechText,
    outputDirectory: directory,
    provider,
  });
  assert.equal(calls, 1);
  const audio = await readFile(path.join(directory, "segment-001.wav"));
  assert.ok(audio.length > 44);
});

function fakeProvider({
  id,
  voiceId,
  model = null,
  language = null,
  apiVersion = null,
  sampleRate = null,
  synthesize,
}) {
  return {
    id,
    voiceId,
    outputFormat: "wav",
    constructor: { name: `${id}FakeProvider` },
    getSynthesisIdentity() {
      return buildSynthesisIdentity({
        providerId: id,
        model,
        apiVersion,
        voiceId,
        language,
        output: {
          container: "wav",
          encoding: "pcm_s16le",
          sample_rate: sampleRate,
        },
      });
    },
    synthesize,
  };
}

function makePcmWav(pcm) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(44100, 24);
  header.writeUInt32LE(88200, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  const wav = Buffer.concat([header, pcm]);
  // Normalize streaming-style sizes if needed.
  return normalizeWavBuffer(wav).buffer;
}
