import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  createSubstackDraft,
  markdownToSubstackHtml,
  parseMarkdownPublication,
} from "../src/substack-publisher.js";

const markdownPath = new URL(
  "../publications/2026-10-25-manifeste-possibiliste.md",
  import.meta.url,
);
const htmlPath = new URL(
  "../publications/2026-10-25-manifeste-possibiliste.html",
  import.meta.url,
);

function plainMarkdownText(markdown) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^(---|\*\*\*|___)$/.test(line))
    .map((line) => line
      .replace(/^#{1,6}\s+/, "")
      .replace(/^>\s?/, "")
      .replace(/^[*+-]\s+/, "")
      .replace(/\[([^\]]+)\]\([^\s)]+\)/g, "$1")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1"))
    .join("\n");
}

test("possibilist Substack package records exact public source provenance", () => {
  const raw = fs.readFileSync(markdownPath, "utf8");
  const publication = parseMarkdownPublication(markdownPath.pathname);

  assert.equal(publication.title, "Contre l'Académie — L'indépendance d'esprit d'abord");
  assert.equal(publication.subtitle, "Manifeste possibiliste");
  assert.match(raw, /source_commit: 5243c204e3b6eff072bef1d3cd86d5c617b12d2e/);
  assert.match(raw, /source_blob: a59011e0a3bb402f99374ba27ebac92cb4e3d848/);
  assert.match(raw, /source_sha256: 0465cfc98d2e9297409b13c81e546dbd58c9b05b226753e9aead329e720cd14e/);
  assert.match(raw, /analytical_note_blob: 00650a4cea17611851de4ac05e5d8a2c6064f5d9/);
  assert.match(raw, /analytical_note_sha256: 18858e50fc9ea55184e1add04fe066d956f7708489b8e531504c33f0bb840cd3/);
  assert.match(raw, /publication_status: draft/);
  assert.match(raw, /platform: substack/);
  assert.match(raw, /persona: public_intellectual/);
  assert.match(raw, /human_publication_decision: pending/);
});

test("Substack conversion preserves package text and expected Markdown formatting", () => {
  const publication = parseMarkdownPublication(markdownPath.pathname);
  const html = markdownToSubstackHtml(publication.body);
  const savedHtml = fs.readFileSync(htmlPath, "utf8").trim();

  assert.equal(savedHtml, html);
  const htmlText = html.replace(/<[^>]*>/g, "").trim().replace(/\n+/g, "\n");
  const markdownText = plainMarkdownText(publication.body).replace(/\n+/g, "\n");
  assert.equal(htmlText, markdownText);
  assert.match(html, /<h2>Chapeau éditorial<\/h2>/);
  assert.match(html, /<h3>À ceux qui cherchent<\/h3>/);
  assert.match(html, /<strong>L'indépendance d'esprit d'abord\.<\/strong>/);
  assert.match(html, /<em>Manifeste possibiliste — version 0\.4<\/em>/);
  assert.match(html, /<a href="https:\/\/github\.com\/JeanHuguesRobert\/barons-Mariani\/blob\/main\/research\/manifeste_possibiliste_note_analytique\.md"/);
  assert.match(html, /<hr\/>/);
  assert.match(html, /Nous cherchons à rendre possible le suivant\./);
  assert.doesNotMatch(html, /\*\*|(^|\n)#{1,6}\s/m);
});

test("Substack draft helper refuses to call the network without a session cookie", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    throw new Error("network call was not expected");
  };
  try {
    const result = await createSubstackDraft({
      title: "Local safety check",
      markdownBody: "No network or credential required.",
    });
    assert.deepEqual(result, {
      ok: false,
      error: "Missing Substack session cookie (SUBSTACK_SID)",
    });
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
