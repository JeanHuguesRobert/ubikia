import assert from "node:assert/strict";
import test from "node:test";

import {
  OBSERVED_APPEARANCE_SCHEMA,
  createObservedAppearance,
} from "../src/publication/appearance-trace.js";

test("creates a durable observed appearance without inventing a platform URL", () => {
  const appearance = createObservedAppearance({
    id: "facebook:comment:example-001",
    platform: "Facebook",
    kind: "comment",
    text_snapshot: "A verified public comment.",
    visibility: "public",
    observed_at: "2026-09-06",
    observed_at_precision: "day",
    observed_by: "Jean Hugues Noël Robert",
    publisher: "Jean Hugues Noël Robert",
    locator: {
      canonical_url: null,
      retrieval_locator: "https://www.facebook.com/permalink.php?story_fbid=example",
      platform_id: null,
    },
    parent_context: {
      kind: "facebook_post",
      publisher: "Example author",
    },
  });

  assert.equal(appearance.schema, OBSERVED_APPEARANCE_SCHEMA);
  assert.equal(appearance.locator.canonical_url, null);
  assert.equal(appearance.locator.retrieval_locator, "https://www.facebook.com/permalink.php?story_fbid=example");
  assert.match(appearance.text_snapshot_sha256, /^sha256:/);
  assert.match(appearance.integrity_sha256, /^sha256:/);
});

test("requires observed facts rather than silently accepting an intended publication", () => {
  assert.throws(
    () => createObservedAppearance({ id: "draft-only" }),
    /platform is required/,
  );
});
