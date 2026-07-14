import assert from "node:assert/strict";
import test from "node:test";

import { validateSpokenAdaptation } from "../src/audible/adapt.js";

test("ignores publication metadata numbers in YAML front matter", () => {
  const sourceText = `---
date: "2026-07-11"
version: "0.3"
license: "CC BY-SA 4.0"
affiliation: "1 cours Paoli, F-20250 Corte"
---

Le corps du texte ne contient aucun nombre.
`;
  const spokenText = "Le corps du texte ne contient aucun nombre.";

  const validation = validateSpokenAdaptation({ sourceText, spokenText });

  assert.equal(validation.status, "mechanical_checks_passed");
  assert.equal(validation.validation_basis, "source_body_without_yaml_front_matter");
  assert.deepEqual(validation.missing_numeric_tokens, []);
  assert.deepEqual(validation.warnings, []);
});

test("still reports numbers omitted from the source body", () => {
  const sourceText = `---
date: "2026-07-11"
---

Cette mission mobilise 5 agents spécialisés.
`;
  const spokenText = "Cette mission mobilise plusieurs agents spécialisés.";

  const validation = validateSpokenAdaptation({ sourceText, spokenText });

  assert.equal(validation.status, "review_required");
  assert.deepEqual(validation.missing_numeric_tokens, ["5"]);
  assert.match(validation.warnings[0], /source body/);
});
