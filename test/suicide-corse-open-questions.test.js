import assert from "node:assert/strict";
import test from "node:test";
import { renderMarkdown, stripFrontmatter } from "../scripts/render-suicide-corse-open-questions.mjs";

test("open questions renderer strips frontmatter and keeps epistemic wording", () => {
  const markdown = `---
title: Example
---
# Questions ouvertes

Une question n'est ni une accusation.

## Section

- **Question** utile
`;
  assert.match(stripFrontmatter(markdown), /^# Questions ouvertes/);
  const html = renderMarkdown(markdown);
  assert.match(html, /<h1>Questions ouvertes<\/h1>/);
  assert.match(html, /Une question n'est ni une accusation\./);
  assert.match(html, /<strong>Question<\/strong> utile/);
});
