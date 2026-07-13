export class ConfigurationInvariantError extends Error {
  constructor(path, expected, actual, source = null) {
    super(
      `Configuration invariant failed at ${path}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      + (source ? ` from ${source}` : ""),
    );
    this.name = "ConfigurationInvariantError";
    this.path = path;
    this.expected = expected;
    this.actual = actual;
    this.source = source;
  }
}

export const MANDATORY_INVARIANTS = Object.freeze([
  {
    path: "publicationPolicy.humanReviewRequired",
    expected: true,
    reason: "Derived products require a human or explicitly governed review checkpoint.",
  },
  {
    path: "publicationPolicy.automaticPublicPublicationAllowed",
    expected: false,
    reason: "Public publication must remain a distinct, explicit act.",
  },
]);

export function mergeConfigurationLayers(layers, {
  invariants = MANDATORY_INVARIANTS,
} = {}) {
  if (!Array.isArray(layers) || layers.length === 0) {
    throw new TypeError("layers must be a non-empty array");
  }

  const config = {};
  const provenance = {};
  const appliedLayers = [];

  for (const [index, layer] of layers.entries()) {
    validateLayer(layer, index);
    mergeObject(config, layer.value, [], provenance, layer);
    appliedLayers.push({
      name: layer.name,
      source: layer.source ?? null,
      commit: layer.commit ?? null,
      precedence: index,
    });
  }

  const invariantResults = invariants.map((invariant) => {
    const actual = getAtPath(config, invariant.path);
    if (!deepEqual(actual, invariant.expected)) {
      throw new ConfigurationInvariantError(
        invariant.path,
        invariant.expected,
        actual,
        provenance[invariant.path]?.source ?? null,
      );
    }
    return {
      ...invariant,
      status: "satisfied",
      provenance: provenance[invariant.path] ?? null,
    };
  });

  return {
    config,
    provenance,
    layers: appliedLayers,
    invariants: invariantResults,
  };
}

export function inspectSecretReferences(config, {
  environment = process.env,
} = {}) {
  const references = [];
  walkLeaves(config, [], (pathParts, value) => {
    if (typeof value !== "string") return;
    const match = /^(env|secret|credential):(.+)$/.exec(value);
    if (!match) return;

    const [, kind, name] = match;
    references.push({
      path: pathParts.join("."),
      reference: value,
      kind,
      name,
      status: kind === "env"
        ? (Object.hasOwn(environment, name) && environment[name] !== "" ? "available" : "missing")
        : "external_resolver_required",
    });
  });
  return references;
}

export function getAtPath(object, dottedPath) {
  return dottedPath.split(".").reduce(
    (current, part) => (current === null || current === undefined ? undefined : current[part]),
    object,
  );
}

function validateLayer(layer, index) {
  if (!layer || typeof layer !== "object") {
    throw new TypeError(`Layer ${index} must be an object`);
  }
  if (typeof layer.name !== "string" || layer.name.trim() === "") {
    throw new TypeError(`Layer ${index} requires a non-empty name`);
  }
  if (!isPlainObject(layer.value)) {
    throw new TypeError(`Layer ${layer.name} value must be a plain object`);
  }
}

function mergeObject(target, incoming, pathParts, provenance, layer) {
  for (const [key, incomingValue] of Object.entries(incoming)) {
    const nextPath = [...pathParts, key];
    const dottedPath = nextPath.join(".");

    if (isPlainObject(incomingValue)) {
      if (!isPlainObject(target[key])) target[key] = {};
      mergeObject(target[key], incomingValue, nextPath, provenance, layer);
      if (Object.keys(incomingValue).length === 0) {
        provenance[dottedPath] = describeProvenance(layer);
      }
      continue;
    }

    target[key] = structuredClone(incomingValue);
    deleteDescendantProvenance(provenance, dottedPath);
    provenance[dottedPath] = describeProvenance(layer);
  }
}

function describeProvenance(layer) {
  return {
    layer: layer.name,
    source: layer.source ?? null,
    commit: layer.commit ?? null,
  };
}

function deleteDescendantProvenance(provenance, path) {
  const prefix = `${path}.`;
  for (const key of Object.keys(provenance)) {
    if (key.startsWith(prefix)) delete provenance[key];
  }
}

function walkLeaves(value, pathParts, visitor) {
  if (Array.isArray(value) || !isPlainObject(value)) {
    visitor(pathParts, value);
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    walkLeaves(child, [...pathParts, key], visitor);
  }
}

function isPlainObject(value) {
  return value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
