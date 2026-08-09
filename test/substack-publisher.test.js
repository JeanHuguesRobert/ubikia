import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { parseMarkdownPublication, markdownToSubstackHtml } from "../src/substack-publisher.js";

test("parseMarkdownPublication extracts title and subtitle", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ubikia-test-"));
  const tmpFile = path.join(tmpDir, "test.md");
  fs.writeFileSync(
    tmpFile,
    `---
title: "Mon Titre Substack"
description: "Mon Sous-titre Substack"
---

Voici le corps de l'article.`
  );

  const parsed = parseMarkdownPublication(tmpFile);
  assert.equal(parsed.title, "Mon Titre Substack");
  assert.equal(parsed.subtitle, "Mon Sous-titre Substack");
  assert.equal(parsed.body, "Voici le corps de l'article.");
});

test("markdownToSubstackHtml converts markdown formatting", () => {
  const html = markdownToSubstackHtml("# Titre\n\nDu texte **gras** et *italique*.");
  assert.ok(html.includes("<h1>Titre</h1>"));
  assert.ok(html.includes("<strong>gras</strong>"));
  assert.ok(html.includes("<em>italique</em>"));
});
