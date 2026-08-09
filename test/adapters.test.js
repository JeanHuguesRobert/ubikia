import test from "node:test";
import assert from "node:assert/strict";
import { ADAPTERS, getAvailableAdapters } from "../src/adapters/index.js";

test("getAvailableAdapters returns registered platforms", () => {
  const adapters = getAvailableAdapters();
  assert.ok(adapters.includes("substack"));
  assert.ok(adapters.includes("ghost"));
  assert.ok(adapters.includes("wordpress"));
  assert.ok(adapters.includes("devto"));
  assert.ok(adapters.includes("tumblr"));
});

test("ghost adapter validates missing env vars", async () => {
  const res = await ADAPTERS.ghost.createDraft({ title: "Test", body: "Body" }, {});
  assert.equal(res.ok, false);
  assert.ok(res.error.includes("Missing GHOST_URL"));
});

test("wordpress adapter validates missing env vars", async () => {
  const res = await ADAPTERS.wordpress.createDraft({ title: "Test", body: "Body" }, {});
  assert.equal(res.ok, false);
  assert.ok(res.error.includes("Missing WORDPRESS_URL"));
});

test("tumblr adapter validates missing env vars", async () => {
  const res = await ADAPTERS.tumblr.createDraft({ title: "Test", body: "Body" }, {});
  assert.equal(res.ok, false);
  assert.ok(res.error.includes("Missing TUMBLR_OAUTH_TOKEN"));
});
