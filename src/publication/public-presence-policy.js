const DISTRIBUTION_STRATEGIES = new Set([
  "none",
  "manual",
  "principal_selected",
]);

export class PublicPresencePolicyError extends Error {
  constructor(message) {
    super(message);
    this.name = "PublicPresencePolicyError";
  }
}

/**
 * Validate the declared means of a public-presence package.
 *
 * This deliberately does not classify, approve, or suppress the principal's
 * opinions. It checks only the package's explicit objective and the governed
 * constraints on how Ubikia may prepare or distribute it.
 */
export function validatePublicPresencePackage(publicationPackage, {
  policy,
} = {}) {
  if (!publicationPackage || typeof publicationPackage !== "object") {
    throw new TypeError("publicationPackage must be an object");
  }
  validatePolicy(policy);

  const presence = publicationPackage.public_presence;
  if (!presence || typeof presence !== "object" || Array.isArray(presence)) {
    throw new PublicPresencePolicyError("public_presence is required");
  }

  const objectives = presence.editorial_objectives;
  if (!Array.isArray(objectives) || objectives.length === 0 || objectives.some((value) => (
    typeof value !== "string" || value.trim() === ""
  ))) {
    throw new PublicPresencePolicyError("public_presence.editorial_objectives must be a non-empty string array");
  }

  if (!DISTRIBUTION_STRATEGIES.has(presence.distribution_strategy)) {
    throw new PublicPresencePolicyError(
      "public_presence.distribution_strategy must be none, manual, or principal_selected",
    );
  }

  assertFalse(presence.fabricated_support, "public_presence.fabricated_support must be false");
  assertFalse(
    presence.autonomous_engagement_optimization,
    "public_presence.autonomous_engagement_optimization must be false",
  );
  assertFalse(
    presence.opinion_normalization,
    "public_presence.opinion_normalization must be false",
  );

  return {
    editorial_objectives: objectives.map((value) => value.trim()),
    distribution_strategy: presence.distribution_strategy,
    fabricated_support: false,
    autonomous_engagement_optimization: false,
    opinion_normalization: false,
  };
}

function validatePolicy(policy) {
  if (!policy || typeof policy !== "object") {
    throw new PublicPresencePolicyError("A resolved publicPresencePolicy is required");
  }
  const required = {
    editorialObjectivesMustBeExplicit: true,
    autonomousEngagementOptimizationAllowed: false,
    fabricatedSupportAllowed: false,
    opinionNormalizationAllowed: false,
  };
  for (const [key, expected] of Object.entries(required)) {
    if (policy[key] !== expected) {
      throw new PublicPresencePolicyError(`publicPresencePolicy.${key} must be ${expected}`);
    }
  }
}

function assertFalse(value, message) {
  if (value !== false) throw new PublicPresencePolicyError(message);
}
