const RISK_VALUES = new Set(["unknown", "none", "contextual", "material"]);
const REVIEW_VALUES = new Set([
  "not_applicable",
  "not_reviewed",
  "pending",
  "substantive_reviewed",
  "editorial_controlled",
]);

/**
 * Normalize the publication-facing authenticity assessment without guessing
 * that an unknown assessment means no disclosure is necessary.
 */
export function normalizeAuthenticity(value = null) {
  if (value == null) {
    return {
      authenticity_risk: "unknown",
      disclosure_required: null,
      disclosure_text: null,
      human_editorial_review: "pending",
      responsible_publisher: null,
    };
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("authenticity must be an object when provided");
  }

  const normalized = {
    authenticity_risk: value.authenticity_risk ?? "unknown",
    disclosure_required: value.disclosure_required ?? null,
    disclosure_text: value.disclosure_text ?? null,
    human_editorial_review: value.human_editorial_review ?? "pending",
    responsible_publisher: value.responsible_publisher ?? null,
  };

  if (!RISK_VALUES.has(normalized.authenticity_risk)) {
    throw new Error(`Unknown authenticity_risk: ${normalized.authenticity_risk}`);
  }
  if (normalized.disclosure_required !== null && typeof normalized.disclosure_required !== "boolean") {
    throw new TypeError("authenticity.disclosure_required must be boolean or null");
  }
  if (normalized.disclosure_text !== null && typeof normalized.disclosure_text !== "string") {
    throw new TypeError("authenticity.disclosure_text must be string or null");
  }
  if (!REVIEW_VALUES.has(normalized.human_editorial_review)) {
    throw new Error(`Unknown human_editorial_review: ${normalized.human_editorial_review}`);
  }
  if (normalized.responsible_publisher !== null && typeof normalized.responsible_publisher !== "string") {
    throw new TypeError("authenticity.responsible_publisher must be string or null");
  }
  if (normalized.disclosure_required === true && !normalized.disclosure_text?.trim()) {
    throw new Error("authenticity.disclosure_text is required when disclosure_required=true");
  }

  return normalized;
}

export function normalizeContributionRoles(value = null) {
  if (value == null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("contributionRoles must be an object when provided");
  }

  const roles = {};
  for (const key of ["principal", "twin_or_agent", "substantive_reviewer", "responsible_publisher"]) {
    const role = value[key] ?? null;
    if (role !== null && typeof role !== "string") {
      throw new TypeError(`contributionRoles.${key} must be string or null`);
    }
    roles[key] = role;
  }
  return roles;
}

export function alteredOrSyntheticContentFromAuthenticity(authenticity) {
  if (authenticity.authenticity_risk === "material") return true;
  if (authenticity.authenticity_risk === "none") return false;
  return null;
}
