import path from "node:path";
import { loadContract } from "./contract.js";
import { readInput } from "./contract.js";
import { loadCorpus } from "./corpus.js";

export async function loadProjection(corpusPath, projectionPath) {
  const projection = await loadContract(projectionPath);
  const corpus = await loadCorpus(corpusPath, projection);
  const contract = projection.data;
  const coverImage = contract.cover === undefined ? null : await readInput(
    path.resolve(path.dirname(projection.path), contract.cover.image),
  );
  const printPdf = contract.cover?.print_pdf === undefined ? null : await readInput(
    path.resolve(path.dirname(projection.path), contract.cover.print_pdf),
  );
  if (coverImage !== null && path.extname(coverImage.path).toLowerCase() !== ".png") {
    throw new Error(`projection.cover.image must be a PNG: ${coverImage.path}`);
  }
  if (printPdf !== null && (path.extname(printPdf.path).toLowerCase() !== ".pdf"
      || printPdf.bytes.subarray(0, 5).toString() !== "%PDF-")) {
    throw new Error(`projection.cover.print_pdf must be a PDF: ${printPdf.path}`);
  }
  const ir = {
    editionId: contract.id,
    medium: contract.medium ?? "book",
    previousEditionId: contract.previous_edition_id ?? null,
    parentEditionId: contract.parent_edition_id ?? null,
    title: contract.title,
    subtitle: contract.subtitle,
    author: contract.author,
    language: contract.language,
    chapters: corpus.chapters,
    outputs: contract.outputs.required,
    sourceManifestPath: corpus.path,
    projectionPath: projection.path,
    cover: contract.cover === undefined ? null : {
      ...contract.cover,
      image: coverImage,
      outputPath: path.posix.join("cover", path.basename(coverImage.path)),
      printPdf,
      printPdfOutputPath: printPdf === null ? null : path.posix.join("cover", path.basename(printPdf.path)),
    },
  };
  return { ir, corpus, projection };
}
