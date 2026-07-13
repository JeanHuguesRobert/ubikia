import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  ConfigurationInvariantError,
  inspectSecretReferences,
  mergeConfigurationLayers,
} from "../src/config/merge-config-layers.js";
import {
  loadUserConfiguration,
  serializeResolvedUserConfiguration,
} from "../src/config/load-user-profile.js";

test("higher-precedence layers replace leaves and preserve provenance", () => {
  const result = mergeConfigurationLayers([
    {
      name: "defaults",
      source: "defaults.json",
      value: {
        defaultLanguage: "en",
        audio: { defaultFormats: ["mp3", "opus"] },
        publicationPolicy: {
          humanReviewRequired: true,
          automaticPublicPublicationAllowed: false,
        },
      },
    },
    {
      name: "public",
      source: "account:.ubikia/profile.json",
      commit: "abc123",
      value: {
        defaultLanguage: "fr",
        audio: { defaultFormats: ["mp3"] },
      },
    },
  ]);

  assert.equal(result.config.defaultLanguage, "fr");
  assert.deepEqual(result.config.audio.defaultFormats, ["mp3"]);
  assert.deepEqual(result.provenance.defaultLanguage, {
    layer: "public",
    source: "account:.ubikia/profile.json",
    commit: "abc123",
  });
  assert.equal(result.invariants.length, 2);
});

test("mandatory publication invariants cannot be weakened", () => {
  assert.throws(
    () => mergeConfigurationLayers([
      {
        name: "defaults",
        value: {
          publicationPolicy: {
            humanReviewRequired: true,
            automaticPublicPublicationAllowed: false,
          },
        },
      },
      {
        name: "override",
        source: "job.json",
        value: {
          publicationPolicy: {
            automaticPublicPublicationAllowed: true,
          },
        },
      },
    ]),
    ConfigurationInvariantError,
  );
});

test("secret references are inspected without resolving values", () => {
  const references = inspectSecretReferences({
    secretReferences: {
      present: "env:PRESENT_SECRET",
      missing: "env:MISSING_SECRET",
      external: "secret:youtube-upload-token",
    },
  }, {
    environment: { PRESENT_SECRET: "not-returned" },
  });

  assert.deepEqual(references.map(({ name, status }) => ({ name, status })), [
    { name: "PRESENT_SECRET", status: "available" },
    { name: "MISSING_SECRET", status: "missing" },
    { name: "youtube-upload-token", status: "external_resolver_required" },
  ]);
  assert.equal(JSON.stringify(references).includes("not-returned"), false);
});

test("file-based resolver loads repository-relative instructions and omits content when serialized", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ubikia-config-"));
  const profileDirectory = path.join(root, ".ubikia");
  await mkdir(profileDirectory, { recursive: true });

  await writeFile(path.join(profileDirectory, "instructions.md"), "# Public instructions\n", "utf8");
  await writeFile(path.join(profileDirectory, "profile.json"), JSON.stringify({
    schema: "ubikia.user-profile.v0.1",
    account: "example",
    displayName: "Example Author",
    defaultLanguage: "fr",
    instructionFiles: [".ubikia/instructions.md"],
    publicationPolicy: {
      humanReviewRequired: true,
      automaticPublicPublicationAllowed: false,
    },
    secretReferences: {
      provider: "env:EXAMPLE_API_KEY",
    },
  }), "utf8");

  const result = await loadUserConfiguration({
    publicProfile: path.join(profileDirectory, "profile.json"),
    environment: {},
  });

  assert.equal(result.config.account, "example");
  assert.equal(result.instructions.length, 1);
  assert.equal(result.instructions[0].content, "# Public instructions\n");
  assert.equal(result.secret_references[0].status, "missing");

  const serialized = serializeResolvedUserConfiguration(result);
  assert.equal(Object.hasOwn(serialized.instructions[0], "content"), true);
  assert.equal(serialized.instructions[0].content, undefined);
  assert.equal(JSON.stringify(serialized).includes("# Public instructions"), false);
});
