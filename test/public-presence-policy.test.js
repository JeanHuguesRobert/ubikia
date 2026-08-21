import assert from "node:assert/strict";
import test from "node:test";

import {
  PublicPresencePolicyError,
  validatePublicPresencePackage,
} from "../src/publication/public-presence-policy.js";

const policy = {
  editorialObjectivesMustBeExplicit: true,
  autonomousEngagementOptimizationAllowed: false,
  fabricatedSupportAllowed: false,
  opinionNormalizationAllowed: false,
};

function packageWith(overrides = {}) {
  return {
    public_presence: {
      editorial_objectives: ["Explain a sourced public position"],
      distribution_strategy: "principal_selected",
      fabricated_support: false,
      autonomous_engagement_optimization: false,
      opinion_normalization: false,
      ...overrides,
    },
  };
}

test("validates a principal-directed public-presence package without inspecting its opinion", () => {
  const result = validatePublicPresencePackage(packageWith(), { policy });

  assert.deepEqual(result, {
    editorial_objectives: ["Explain a sourced public position"],
    distribution_strategy: "principal_selected",
    fabricated_support: false,
    autonomous_engagement_optimization: false,
    opinion_normalization: false,
  });
});

test("requires an explicit editorial objective", () => {
  assert.throws(
    () => validatePublicPresencePackage(packageWith({ editorial_objectives: [] }), { policy }),
    PublicPresencePolicyError,
  );
});

test("rejects fabricated support and autonomous engagement optimization", () => {
  assert.throws(
    () => validatePublicPresencePackage(packageWith({ fabricated_support: true }), { policy }),
    PublicPresencePolicyError,
  );
  assert.throws(
    () => validatePublicPresencePackage(packageWith({ autonomous_engagement_optimization: true }), { policy }),
    PublicPresencePolicyError,
  );
});

test("rejects a configuration that would normalize opinions", () => {
  assert.throws(
    () => validatePublicPresencePackage(packageWith(), {
      policy: { ...policy, opinionNormalizationAllowed: true },
    }),
    PublicPresencePolicyError,
  );
});
