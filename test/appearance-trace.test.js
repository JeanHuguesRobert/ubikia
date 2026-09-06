import assert from "node:assert/strict";
import test from "node:test";

import {
  APPEARANCE_LOCATOR_OBSERVATION_SCHEMA,
  OBSERVED_APPEARANCE_SCHEMA,
  createAppearanceLocatorObservation,
  createObservedAppearance,
} from "../src/publication/appearance-trace.js";
import { registerObservedAppearanceInCop } from "../src/publication/cop-trace-adapter.js";

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

test("adds a later locator readback without mutating the original appearance", () => {
  const observation = createAppearanceLocatorObservation({
    id: "facebook:comment:example-001:locator-001",
    appearance_ref: "facebook:comment:example-001",
    observed_at: "2026-09-06T12:30:22.752Z",
    observed_by: "Agent John / Cogentia Navigation Assistant",
    locator: {
      canonical_url: "https://www.facebook.com/permalink.php?comment_id=123",
      retrieval_locator: "https://www.facebook.com/permalink.php?story_fbid=example",
      platform_id: "123",
    },
    displayed: { modified: true },
  });

  assert.equal(observation.schema, APPEARANCE_LOCATOR_OBSERVATION_SCHEMA);
  assert.equal(observation.appearance_ref, "facebook:comment:example-001");
  assert.equal(observation.displayed.modified, true);
  assert.match(observation.integrity_sha256, /^sha256:/);
});

test("requires observed facts rather than silently accepting an intended publication", () => {
  assert.throws(
    () => createObservedAppearance({ id: "draft-only" }),
    /platform is required/,
  );
});

test("registers an appearance as an external COP trace without duplicating its text", () => {
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
      canonical_url: "https://www.facebook.com/permalink.php?comment_id=123",
      retrieval_locator: "https://www.facebook.com/permalink.php?story_fbid=example",
      platform_id: "123",
    },
  });
  const calls = [];
  const cop = {
    createExternalTraceRef(value) {
      calls.push(["ref", value]);
      return { schema: "cop.trace-ref/v1", target_type: "external", ...value };
    },
    createTraceDescriptor(value) {
      calls.push(["descriptor", value]);
      return { schema: "cop.trace-descriptor/v1", ...value };
    },
    createTraceObservationEvent(value) {
      calls.push(["event", value]);
      return { event_type: "TraceObservation", payload: { cop_originated: false }, ...value };
    },
  };

  const registration = registerObservedAppearanceInCop(appearance, {
    cop,
    registered_at: "2026-09-06T12:30:22.752Z",
    observer_ref: "agent:jhn",
    topic_id: "topic:jhn:public-appearances",
    principal_ref: "principal:jhn",
    logical_agent_ref: "agent:jhn",
  });

  assert.equal(calls.length, 3);
  assert.equal(registration.trace_ref.trace_id, "external:ubikia:facebook:comment:example-001");
  assert.equal(registration.trace_descriptor.visibility, "open");
  assert.equal(registration.trace_descriptor.custody, "www.facebook.com");
  assert.equal(registration.observation_event.payload.cop_originated, false);
  assert.equal(JSON.stringify(registration.trace_descriptor).includes(appearance.text_snapshot), false);
});
