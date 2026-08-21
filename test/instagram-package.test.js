import assert from "node:assert/strict";
import test from "node:test";

import { createInstagramPublicationPackage } from "../src/publication/instagram-package.js";

const resolvedConfiguration = {
  config: {
    defaultLanguage: "fr",
    publicPresencePolicy: {
      editorialObjectivesMustBeExplicit: true,
      autonomousEngagementOptimizationAllowed: false,
      fabricatedSupportAllowed: false,
      opinionNormalizationAllowed: false,
    },
  },
};

function draft(overrides = {}) {
  return {
    id: "ig_20260821_01",
    form: "carousel",
    principal: "Jean Hugues Noël Robert",
    persona: "Les Carnets du Baron Mariani",
    title: "Capacité de présence publique",
    caption: "Un texte de travail, à relire avant toute publication.",
    media: [
      { filename: "card-01.png", type: "image", alt_text: "Titre du carrousel" },
      { filename: "card-02.png", type: "image", alt_text: "Argument sourcé" },
    ],
    public_presence: {
      editorial_objectives: ["Explain a sourced public position"],
      distribution_strategy: "principal_selected",
      fabricated_support: false,
      autonomous_engagement_optimization: false,
      opinion_normalization: false,
    },
    provenance: {
      source_repository: "JeanHuguesRobert/cogentia",
      source_path: "research/ia_pour_tous_ia_pour_chacun.md",
      source_commit: "a360eeb286630f44caa640fd31309298d1b0173a",
    },
    ...overrides,
  };
}

test("creates a local, human-governed Instagram carousel package", () => {
  const publicationPackage = createInstagramPublicationPackage({
    draft: draft(),
    resolvedConfiguration,
    now: new Date("2026-08-21T12:00:00.000Z"),
  });

  assert.equal(publicationPackage.status, "draft");
  assert.equal(publicationPackage.target, "instagram");
  assert.equal(publicationPackage.language, "fr");
  assert.equal(publicationPackage.media.length, 2);
  assert.equal(publicationPackage.human_publication_gates.manual_publication_required, true);
  assert.equal(publicationPackage.human_publication_gates.remote_api_call_performed, false);
});

test("refuses a package without accessible media descriptions", () => {
  assert.throws(
    () => createInstagramPublicationPackage({
      draft: draft({
        media: [
          { filename: "card-01.png", type: "image", alt_text: "" },
          { filename: "card-02.png", type: "image", alt_text: "Argument sourcé" },
        ],
      }),
      resolvedConfiguration,
    }),
    /alt_text is required/,
  );
});

test("refuses a package that tries to fabricate support", () => {
  assert.throws(
    () => createInstagramPublicationPackage({
      draft: draft({
        public_presence: {
          ...draft().public_presence,
          fabricated_support: true,
        },
      }),
      resolvedConfiguration,
    }),
    /fabricated_support must be false/,
  );
});
