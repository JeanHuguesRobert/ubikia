import { OBSERVED_APPEARANCE_SCHEMA } from "./appearance-trace.js";

/**
 * Translate a source-first Ubikia observed appearance into the concrete COP
 * external-trace registration flow. COP factories are injected so Ubikia does
 * not copy or own the generic protocol implementation.
 */
export function registerObservedAppearanceInCop(
  appearance,
  {
    cop,
    registered_at,
    observer_ref,
    topic_id,
    mandate_ref = null,
    principal_ref = null,
    logical_agent_ref = null,
  } = {},
) {
  validateAppearance(appearance);
  requireText(registered_at, "registered_at");
  requireText(observer_ref, "observer_ref");
  requireText(topic_id, "topic_id");
  validateCopFactories(cop);

  const locator = appearance.locator.canonical_url ?? appearance.locator.retrieval_locator;
  const traceRef = cop.createExternalTraceRef({
    trace_id: `external:ubikia:${appearance.id}`,
    integrity: appearance.integrity_sha256,
    locator,
    resolution_hints: {
      platform: appearance.platform,
      platform_id: appearance.locator.platform_id,
      source_schema: appearance.schema,
    },
  });
  const traceDescriptor = cop.createTraceDescriptor({
    trace_ref: traceRef,
    kind: `external_${appearance.platform}_${appearance.kind}`,
    origin: locator ?? `platform:${appearance.platform}`,
    observed_at: registered_at,
    integrity: appearance.integrity_sha256,
    visibility: copVisibility(appearance.visibility),
    custody: custodyFromLocator(locator),
    meta: {
      appearance_id: appearance.id,
      observed_at_precision: appearance.observed_at_precision,
      publisher: appearance.publisher,
    },
  });
  const observationEvent = cop.createTraceObservationEvent({
    trace_ref: traceRef,
    trace_descriptor: traceDescriptor,
    observer_ref,
    topic_id,
    mandate_ref,
    principal_ref,
    logical_agent_ref,
  });

  return {
    trace_ref: traceRef,
    trace_descriptor: traceDescriptor,
    observation_event: observationEvent,
  };
}

function validateAppearance(appearance) {
  if (!appearance || typeof appearance !== "object" || Array.isArray(appearance)) {
    throw new TypeError("appearance must be an object");
  }
  if (appearance.schema !== OBSERVED_APPEARANCE_SCHEMA) {
    throw new TypeError(`appearance.schema must be ${OBSERVED_APPEARANCE_SCHEMA}`);
  }
  for (const name of [
    "id",
    "platform",
    "kind",
    "visibility",
    "observed_at_precision",
    "publisher",
    "integrity_sha256",
  ]) {
    requireText(appearance[name], `appearance.${name}`);
  }
  if (!appearance.locator || typeof appearance.locator !== "object") {
    throw new TypeError("appearance.locator must be an object");
  }
}

function validateCopFactories(cop) {
  for (const name of [
    "createExternalTraceRef",
    "createTraceDescriptor",
    "createTraceObservationEvent",
  ]) {
    if (!cop || typeof cop[name] !== "function") {
      throw new TypeError(`cop.${name} must be a function`);
    }
  }
}

function copVisibility(visibility) {
  return visibility === "public" ? "open" : "restricted";
}

function custodyFromLocator(locator) {
  if (!locator) return null;
  try {
    return new URL(locator).hostname;
  } catch {
    return null;
  }
}

function requireText(value, name) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${name} is required`);
  }
}
