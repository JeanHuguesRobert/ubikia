import { stringify } from "./contract.js";

// Latin Modern, the PDF default, has no glyph for these signs. Map each one
// onto a character the math or text font can draw, including inside verbatim.
const PDF_MISSING_GLYPH_HEADER = [
  "\\usepackage{newunicodechar}",
  "\\newunicodechar{≠}{\\ensuremath{\\neq}}",
  "\\newunicodechar{≈}{\\ensuremath{\\approx}}",
  "\\newunicodechar{│}{|}",
  "\\newunicodechar{─}{-}",
].join("\n");

export function generateQmd(ir) {
  const files = {};
  const names = ir.chapters.map((_, index) => ir.cover === null && index === 0
    ? "index.qmd" : `chapter-${String(index + (ir.cover === null ? 0 : 1)).padStart(3, "0")}.qmd`);
  const book = { title: ir.title, "output-file": ir.editionId };
  if (ir.subtitle !== undefined) book.subtitle = ir.subtitle;
  if (ir.author !== undefined) book.author = ir.author;
  book.chapters = ir.cover === null ? names : ["index.qmd", ...names];
  files["_quarto.yml"] = stringify({
    project: { type: "book", "output-dir": "_book" },
    book,
    lang: ir.language,
    execute: { enabled: false },
    format: Object.fromEntries(ir.outputs.map((format) => [format, {
      ...(format === "pdf" ? {
        documentclass: "scrreprt",
        // Custom title partials bypass Quarto's normal KOMA book defaults.
        // Without DIV=11 the n3 PDF expands from 136 to 195 pages.
        ...(ir.cover?.printPdf ? { classoption: ["DIV=11", "numbers=noendperiod"] } : {}),
        "include-in-header": { text: [PDF_MISSING_GLYPH_HEADER,
          ...(ir.cover?.printPdf ? ["\\usepackage{pdfpages}", "\\KOMAoption{captions}{tableheading}"] : [])].join("\n") },
        ...(ir.cover?.printPdf ? { toc: true, "template-partials": ["before-body.tex"],
          filters: ["drop-cover.lua"] } : {}),
      } : {}),
      ...(ir.cover !== null && format !== "pdf" ? { css: "cover.css" } : {}),
      ...(ir.cover !== null && format === "epub" ? { "epub-cover-image": ir.cover.outputPath } : {}),
    }])),
  });
  if (ir.cover !== null) {
    const cover = ir.cover;
    files["cover.css"] = `.cover-page { text-align: center; break-after: page; page-break-after: always; }\n.cover-page figure { margin: 2rem auto; }\n.cover-page img { max-width: 80%; height: auto; }\n.cover-page .cover-subtitle { font-size: 1.5rem; font-style: italic; margin: 1rem 0 2rem; }\n.cover-page .cover-author { margin-top: 2rem; }\n`;
    files["index.qmd"] = `---\ntitle: ${JSON.stringify(cover.title)}\n---\n\n${cover.printPdf ? '::: {.content-visible when-format="html"}\n\n' : ""}::: {.cover-page}\n\n::: {.cover-subtitle}\n${cover.subtitle}\n:::\n\n![](${cover.outputPath}){fig-alt=${JSON.stringify(`${cover.image_role}: ${cover.title}`)} fig-align="center" width="45%"}\n\n${cover.issue}\n\n${cover.edition}\n${cover.anniversary ? `\n${cover.anniversary}\n` : ""}\n::: {.cover-author}\n${cover.author}  \n*${cover.author_title}*\n:::\n\n:::\n${cover.printPdf ? "\n:::\n" : ""}`;
    if (cover.printPdf) {
      files["before-body.tex"] = `\\includepdf[pages=1,pagecommand={\\thispagestyle{empty}}]{${cover.printPdfOutputPath}}\n\\recalctypearea\n`;
      files["drop-cover.lua"] = `local removed = false\nfunction Header(header)\n  if FORMAT == "latex" and not removed and header.level == 1 then\n    local expected = ${JSON.stringify(cover.title)}\n    if pandoc.utils.stringify(header.content) ~= expected then\n      error("Expected cover chapter before the first content chapter")\n    end\n    removed = true\n    return {}\n  end\nend\nfunction Pandoc(doc)\n  if FORMAT == "latex" and not removed then\n    error("PDF cover chapter was not found")\n  end\n  return doc\nend\n`;
    }
  }
  for (const [index, chapter] of ir.chapters.entries()) {
    // Namespace corpus metadata; it must never become executable Quarto options.
    files[names[index]] = `---\n${stringify({ ubikia_source: {
      path: chapter.sourcePath, frontmatter: chapter.frontmatter,
    } })}---\n${chapter.content}`;
  }
  return files;
}
