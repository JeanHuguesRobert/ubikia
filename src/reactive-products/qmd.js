import { stringify } from "./contract.js";

export function generateQmd(ir) {
  const files = {};
  const names = ir.chapters.map((_, index) => index === 0 ? "index.qmd" : `chapter-${String(index).padStart(3, "0")}.qmd`);
  const book = { title: ir.title, "output-file": ir.editionId };
  if (ir.subtitle !== undefined) book.subtitle = ir.subtitle;
  if (ir.author !== undefined) book.author = ir.author;
  book.chapters = names;
  files["_quarto.yml"] = stringify({
    project: { type: "book", "output-dir": "_book" },
    book,
    lang: ir.language,
    execute: { enabled: false },
    format: Object.fromEntries(ir.outputs.map((format) => [format, format === "pdf"
      ? { "documentclass": "scrreprt" } : {}])),
  });
  for (const [index, chapter] of ir.chapters.entries()) {
    // Namespace corpus metadata; it must never become executable Quarto options.
    files[names[index]] = `---\n${stringify({ ubikia_source: {
      path: chapter.sourcePath, frontmatter: chapter.frontmatter,
    } })}---\n${chapter.content}`;
  }
  return files;
}
