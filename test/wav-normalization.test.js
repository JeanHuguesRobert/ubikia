import assert from "node:assert/strict";
import test from "node:test";

import { normalizeWavBuffer } from "../src/audible/wav.js";

test("repairs streaming RIFF and data sizes without changing PCM samples", () => {
  const pcm = Buffer.from([0x01, 0x00, 0x02, 0x00, 0x03, 0x00, 0x04, 0x00]);
  const wav = makeStreamingPcmWav(pcm);
  const beforePayload = Buffer.from(wav.subarray(44));

  const result = normalizeWavBuffer(wav);

  assert.equal(result.recognized, true);
  assert.equal(result.changed, true);
  assert.equal(result.buffer.readUInt32LE(4), result.buffer.length - 8);
  assert.equal(result.buffer.readUInt32LE(40), pcm.length);
  assert.deepEqual(result.buffer.subarray(44), beforePayload);
  assert.deepEqual(
    result.repairs.map(({ field }) => field),
    ["riff_chunk_size", "data_chunk_size"],
  );
});

test("normalization is idempotent", () => {
  const normalized = normalizeWavBuffer(makeStreamingPcmWav(Buffer.alloc(16))).buffer;
  const secondPass = normalizeWavBuffer(normalized);

  assert.equal(secondPass.recognized, true);
  assert.equal(secondPass.changed, false);
  assert.strictEqual(secondPass.buffer, normalized);
  assert.deepEqual(secondPass.repairs, []);
});

test("leaves non-WAV payloads untouched", () => {
  const input = Buffer.from("not a wav file");
  const result = normalizeWavBuffer(input);

  assert.equal(result.recognized, false);
  assert.equal(result.changed, false);
  assert.strictEqual(result.buffer, input);
});

function makeStreamingPcmWav(pcm) {
  const buffer = Buffer.alloc(44 + pcm.length);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(0xffffffff, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(48000, 24);
  buffer.writeUInt32LE(96000, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(0xffffffff, 40);
  pcm.copy(buffer, 44);
  return buffer;
}
