import crypto from "node:crypto";

/**
 * A small, source-first record for an appearance observed on an external
 * publication platform. This is intentionally not a COP TraceDescriptor:
 * COP's trace-centric migration owns that future shared contract.
 */
export const OBSERVED_APPEARANCE_SCHEMA = "ubikia.observed-appearance.v0.1";
export const APPEARANCE_LOCATOR_OBSERVATION_SCHEMA =
  "ubikia.appearance-locator-observation.v0.1";

export function createObservedAppearance({
  id,
  platform,
  kind,
  text_snapshot,
  visibility,
  observed_at,
  observed_at_precision,
  observed_by,
  publisher,
  locator = {},
  parent_context = null,
} = {}) {
  requiredText(id, "id");
  requiredText(platform, "platform");
  requiredText(kind, "kind");
  requiredText(text_snapshot, "text_snapshot");
  requiredText(visibility, "visibility");
  requiredText(observed_at, "observed_at");
  requiredText(observed_at_precision, "observed_at_precision");
  requiredText(observed_by, "observed_by");
  requiredText(publisher, "publisher");

  const appearance = {
    schema: OBSERVED_APPEARANCE_SCHEMA,
    id,
    platform: platform.toLowerCase(),
    kind,
    text_snapshot,
    text_snapshot_sha256: sha256(text_snapshot),
    visibility,
    observed_at,
    observed_at_precision,
    observed_by,
    publisher,
    locator: normalizeLocator(locator),
    parent_context: parent_context ? structuredClone(parent_context) : null,
  };

  return {
    ...appearance,
    integrity_sha256: sha256(JSON.stringify(appearance)),
  };
}

/**
 * Preserve a later platform readback without mutating the original observed
 * appearance. This is useful when a direct comment permalink or platform id
 * becomes available only after initial capture.
 */
export function createAppearanceLocatorObservation({
  id,
  appearance_ref,
  observed_at,
  observed_by,
  locator = {},
  displayed = {},
} = {}) {
  requiredText(id, "id");
  requiredText(appearance_ref, "appearance_ref");
  requiredText(observed_at, "observed_at");
  requiredText(observed_by, "observed_by");
  if (!displayed || typeof displayed !== "object" || Array.isArray(displayed)) {
    throw new TypeError("displayed must be an object");
  }

  const observation = {
    schema: APPEARANCE_LOCATOR_OBSERVATION_SCHEMA,
    id,
    appearance_ref,
    observed_at,
    observed_by,
    locator: normalizeLocator(locator),
    displayed: structuredClone(displayed),
  };
  return {
    ...observation,
    integrity_sha256: sha256(JSON.stringify(observation)),
  };
}

function normalizeLocator(locator) {
  if (!locator || typeof locator !== "object" || Array.isArray(locator)) {
    throw new TypeError("locator must be an object");
  }
  return {
    canonical_url: nullableText(locator.canonical_url, "locator.canonical_url"),
    retrieval_locator: nullableText(locator.retrieval_locator, "locator.retrieval_locator"),
    platform_id: nullableText(locator.platform_id, "locator.platform_id"),
  };
}

function requiredText(value, name) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${name} is required`);
  }
}

function nullableText(value, name) {
  if (value === undefined || value === null) return null;
  requiredText(value, name);
  return value;
}

function sha256(value) {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}
